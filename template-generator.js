const fetch = require('node-fetch');

const OPENAI_TEMPLATE_MODEL = process.env.OPENAI_TEMPLATE_MODEL || 'gpt-4.1-mini';
const CLAUDE_TEMPLATE_MODEL = process.env.CLAUDE_TEMPLATE_MODEL || 'claude-sonnet-4-5';
const TEMPLATE_MAX_OUTPUT_TOKENS = 1800;
const TEMPLATE_CONTEXT_MAX_TEMPLATES = 12;
const TEMPLATE_CONTEXT_MAX_CHARS = 24000;
const TEMPLATE_CONTEXT_MAX_BODY_CHARS = 3000;
const FILE_SUPPORT_MAX_OUTPUT_TOKENS = 2200;
const FILE_SUPPORT_CONTEXT_MAX_FILES = 10;
const FILE_SUPPORT_CONTEXT_MAX_CHARS = 52000;
const FILE_SUPPORT_CONTEXT_MAX_FILE_CHARS = 7000;

function normalizeAIProvider(provider) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  return normalizedProvider === 'claude' ? 'claude' : 'openai';
}

function buildTemplateInstructions(skill) {
  const trimmedSkill = String(skill || '').trim();
  return [
    'You generate reusable technical support templates.',
    'Follow the agent skill below exactly when shaping the template.',
    'Use the loaded templates as the style and structure reference.',
    'Choose the closest loaded template to the pasted text before drafting.',
    'Do not mention which loaded template was used unless the user explicitly asks.',
    'Return only the final markdown template. Do not wrap it in a code fence.',
    'Start with one H1 title, then the template body.',
    '',
    'Agent skill:',
    trimmedSkill
  ].join('\n');
}

function buildFileSupportInstructions(skill) {
  const trimmedSkill = String(skill || '').trim();
  return [
    'You are a senior Digi device support engineer analyzing an imported Digi support archive.',
    'Use only the archive excerpts and dashboard summary provided by the user.',
    'Prioritize troubleshooting value: identity, firmware, uptime, WAN, routes, DNS, cellular, modem, VPN/tunnels, bonding, firewall, logs, and interface counters.',
    'Call out uncertainty when the archive does not include enough evidence.',
    'Cite source file paths inline for important claims.',
    'Return concise markdown with: Findings, Evidence, Recommended next checks.',
    '',
    'File Support skill:',
    trimmedSkill
  ].join('\n');
}

function truncateText(text, maxChars) {
  const trimmed = String(text || '').trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trim()}\n\n[truncated]`;
}

function normalizeTemplateContextTemplate(template, index) {
  const title = String(template?.title || template?.name || `Template ${index + 1}`).trim();
  const body = String(template?.body ?? template?.content ?? template?.text ?? '').trim();
  if (!title && !body) return null;

  return {
    title: title || `Template ${index + 1}`,
    body: truncateText(body, TEMPLATE_CONTEXT_MAX_BODY_CHARS)
  };
}

function normalizeTemplateContext(templates) {
  if (!Array.isArray(templates)) return [];

  return templates
    .map((template, index) => normalizeTemplateContextTemplate(template, index))
    .filter(Boolean)
    .slice(0, TEMPLATE_CONTEXT_MAX_TEMPLATES);
}

function buildLoadedTemplatesContext(templates) {
  const normalizedTemplates = normalizeTemplateContext(templates);
  if (normalizedTemplates.length === 0) {
    return 'No loaded templates were provided.';
  }

  let context = '';
  for (const [index, template] of normalizedTemplates.entries()) {
    const nextBlock = [
      `Template ${index + 1}: ${template.title}`,
      template.body
    ].join('\n\n');

    const separator = context ? '\n\n---\n\n' : '';
    if ((context + separator + nextBlock).length > TEMPLATE_CONTEXT_MAX_CHARS) {
      break;
    }
    context += separator + nextBlock;
  }

  return context || 'No loaded templates were provided.';
}

function buildTemplateUserPrompt(sourceText, templates) {
  return [
    'Create a support template from this pasted text.',
    'Preserve useful technical details, commands, product names, symptoms, and next steps.',
    'Make the result reusable and ready to save as a markdown template.',
    'Use the closest loaded template below for structure, tone, and section order.',
    '',
    'Loaded templates:',
    buildLoadedTemplatesContext(templates),
    '',
    'Pasted text:',
    String(sourceText || '').trim()
  ].join('\n');
}

function normalizeAnalysisFile(file, index) {
  const path = String(file?.path || `support-file-${index + 1}`).trim();
  const text = String(file?.text || '').trim();
  if (!path || !text) return null;

  return {
    path,
    reason: String(file?.reason || '').trim(),
    truncated: Boolean(file?.truncated),
    text: truncateText(text, FILE_SUPPORT_CONTEXT_MAX_FILE_CHARS)
  };
}

function buildFileSupportContext(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return 'No support file excerpts were provided.';
  }

  let context = '';
  for (const [index, rawFile] of files.entries()) {
    if (index >= FILE_SUPPORT_CONTEXT_MAX_FILES) break;
    const file = normalizeAnalysisFile(rawFile, index);
    if (!file) continue;

    const nextBlock = [
      `Source ${index + 1}: ${file.path}`,
      file.reason ? `Why included: ${file.reason}` : '',
      file.truncated ? 'Note: excerpt was truncated before analysis.' : '',
      file.text
    ].filter(Boolean).join('\n\n');

    const separator = context ? '\n\n---\n\n' : '';
    if ((context + separator + nextBlock).length > FILE_SUPPORT_CONTEXT_MAX_CHARS) {
      break;
    }
    context += separator + nextBlock;
  }

  return context || 'No support file excerpts were provided.';
}

function buildFileSupportUserPrompt({ query, files, summary }) {
  const problem = String(query || '').trim();
  const intro = problem
    ? [
        'The user is troubleshooting this reported problem / context:',
        problem,
        '',
        'Use it as the lens for your analysis. Focus your findings on this issue.'
      ]
    : ['Run a first-pass troubleshooting scan of this support archive.'];
  return [
    ...intro,
    '',
    'Dashboard summary JSON:',
    JSON.stringify(summary || {}, null, 2),
    '',
    'Relevant archive excerpts:',
    buildFileSupportContext(files)
  ].join('\n');
}

function extractOpenAIText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function stripMarkdownFence(text) {
  const trimmed = String(text || '').trim();
  const fenceMatch = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return (fenceMatch ? fenceMatch[1] : trimmed).trim();
}

async function parseAPIResponse(response) {
  const body = await response.text();
  let payload = null;
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || body || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function callOpenAITemplateAPI({ apiKey, skill, sourceText, templates }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_TEMPLATE_MODEL,
      instructions: buildTemplateInstructions(skill),
      input: buildTemplateUserPrompt(sourceText, templates),
      max_output_tokens: TEMPLATE_MAX_OUTPUT_TOKENS
    })
  });

  const payload = await parseAPIResponse(response);
  return extractOpenAIText(payload);
}

async function callOpenAIFileSupportAPI({ apiKey, skill, query, files, summary }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_TEMPLATE_MODEL,
      instructions: buildFileSupportInstructions(skill),
      input: buildFileSupportUserPrompt({ query, files, summary }),
      max_output_tokens: FILE_SUPPORT_MAX_OUTPUT_TOKENS
    })
  });

  const payload = await parseAPIResponse(response);
  return extractOpenAIText(payload);
}

// Streams an Anthropic Messages request and returns the accumulated text.
// Streaming keeps the connection active with continuous SSE events, which avoids
// the idle-timeout "Premature close" seen on long non-streaming requests.
async function streamClaudeMessage({ apiKey, maxTokens, system, content }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_TEMPLATE_MODEL,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: 'user', content }]
    })
  });

  // Errors (auth, rate limit, bad request) come back as a non-2xx JSON body, not SSE.
  if (!response.ok) {
    await parseAPIResponse(response);
  }

  const chunks = [];
  let buffer = '';

  const handleEvent = (raw) => {
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      let event;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (event.type === 'error') {
        throw new Error(event.error?.message || 'Anthropic streaming error');
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        chunks.push(event.delta.text);
      }
    }
  };

  for await (const part of response.body) {
    buffer += part.toString('utf8');
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleEvent(raw);
    }
  }
  if (buffer.trim()) {
    handleEvent(buffer);
  }

  return chunks.join('').trim();
}

async function callClaudeTemplateAPI({ apiKey, skill, sourceText, templates }) {
  return streamClaudeMessage({
    apiKey,
    maxTokens: TEMPLATE_MAX_OUTPUT_TOKENS,
    system: buildTemplateInstructions(skill),
    content: buildTemplateUserPrompt(sourceText, templates)
  });
}

async function callClaudeFileSupportAPI({ apiKey, skill, query, files, summary }) {
  return streamClaudeMessage({
    apiKey,
    maxTokens: FILE_SUPPORT_MAX_OUTPUT_TOKENS,
    system: buildFileSupportInstructions(skill),
    content: buildFileSupportUserPrompt({ query, files, summary })
  });
}

async function generateSupportTemplate(options = {}) {
  const provider = normalizeAIProvider(options.provider);
  const apiKey = String(options.apiKey || '').trim();
  const skill = String(options.skill || '').trim();
  const sourceText = String(options.sourceText || '').trim();
  const templates = normalizeTemplateContext(options.templates);

  if (!apiKey) {
    return { success: false, error: 'Provider key is required' };
  }
  if (!skill) {
    return { success: false, error: 'Agent skill is required' };
  }
  if (!sourceText) {
    return { success: false, error: 'Template source text is required' };
  }

  try {
    const template = provider === 'claude'
      ? await callClaudeTemplateAPI({ apiKey, skill, sourceText, templates })
      : await callOpenAITemplateAPI({ apiKey, skill, sourceText, templates });

    if (!template) {
      return { success: false, error: 'The provider returned an empty template' };
    }

    return {
      success: true,
      provider,
      template: stripMarkdownFence(template)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function analyzeSupportFiles(options = {}) {
  const provider = normalizeAIProvider(options.provider);
  const apiKey = String(options.apiKey || '').trim();
  const skill = String(options.skill || '').trim();
  const query = String(options.query || '').trim();
  const files = Array.isArray(options.files) ? options.files : [];
  const summary = options.summary && typeof options.summary === 'object' ? options.summary : {};

  if (!apiKey) {
    return { success: false, error: 'Provider key is required' };
  }
  if (!skill) {
    return { success: false, error: 'File Support skill is required' };
  }
  if (files.length === 0) {
    return { success: false, error: 'No support file excerpts were available for analysis' };
  }

  try {
    const answer = provider === 'claude'
      ? await callClaudeFileSupportAPI({ apiKey, skill, query, files, summary })
      : await callOpenAIFileSupportAPI({ apiKey, skill, query, files, summary });

    if (!answer) {
      return { success: false, error: 'The provider returned an empty analysis' };
    }

    return {
      success: true,
      provider,
      answer: stripMarkdownFence(answer),
      sources: files.map(file => file.path).filter(Boolean)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateSupportTemplate,
  analyzeSupportFiles
};
