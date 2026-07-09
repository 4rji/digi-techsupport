export const DEFAULT_SSH_LOG_PATH = '/var/log/messages';
export const SSH_LOG_PATH_STORAGE_KEY = 'ssh_log_path';
export const SSH_TAIL_LINE_COUNT = 200;

export function buildTailCommand(path) {
  const trimmedPath = String(path || '').trim();
  if (!trimmedPath || /[\r\n]/.test(trimmedPath)) return null;

  const escapedPath = trimmedPath.replace(/'/g, "'\\''");
  return `tail -n ${SSH_TAIL_LINE_COUNT} -f '${escapedPath}'`;
}
