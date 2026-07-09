import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTailCommand } from '../ssh-log-command.mjs';

test('buildTailCommand: builds command for a normal path', () => {
  assert.equal(
    buildTailCommand('/var/log/messages'),
    "tail -n 200 -f '/var/log/messages'"
  );
});

test('buildTailCommand: preserves spaces in paths', () => {
  assert.equal(
    buildTailCommand('/var/log/my messages.log'),
    "tail -n 200 -f '/var/log/my messages.log'"
  );
});

test('buildTailCommand: escapes single quotes', () => {
  assert.equal(
    buildTailCommand("/var/log/o'clock.log"),
    "tail -n 200 -f '/var/log/o'\\''clock.log'"
  );
});

test('buildTailCommand: rejects empty paths', () => {
  assert.equal(buildTailCommand('   '), null);
});

test('buildTailCommand: rejects newline injection attempts', () => {
  assert.equal(buildTailCommand('/var/log/messages\nwhoami'), null);
  assert.equal(buildTailCommand('/var/log/messages\rwhoami'), null);
});
