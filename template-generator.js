const fetch = require('node-fetch');

const OPENAI_TEMPLATE_MODEL = process.env.OPENAI_TEMPLATE_MODEL || 'gpt-4.1-mini';
const CLAUDE_TEMPLATE_MODEL = process.env.CLAUDE_TEMPLATE_MODEL || 'claude-sonnet-4-5';
const TEMPLATE_MAX_OUTPUT_TOKENS = 1800;
const TEMPLATE_CONTEXT_MAX_TEMPLATES = 12;
const TEMPLATE_CONTEXT_MAX_CHARS = 24000;
const TEMPLATE_CONTEXT_MAX_BODY_CHARS = 3000;

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

function extractClaudeText(payload) {
  const chunks = [];
  for (const content of payload?.content || []) {
    if (content?.type === 'text' && typeof content.text === 'string') {
      chunks.push(content.text);
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

async function callClaudeTemplateAPI({ apiKey, skill, sourceText, templates }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_TEMPLATE_MODEL,
      max_tokens: TEMPLATE_MAX_OUTPUT_TOKENS,
      system: buildTemplateInstructions(skill),
      messages: [
        {
          role: 'user',
          content: buildTemplateUserPrompt(sourceText, templates)
        }
      ]
    })
  });

  const payload = await parseAPIResponse(response);
  return extractClaudeText(payload);
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

module.exports = {
  generateSupportTemplate
};
