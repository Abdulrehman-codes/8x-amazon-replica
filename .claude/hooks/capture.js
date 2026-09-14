#!/usr/bin/env node
// 8x assignment capture hook. Invoked by Claude Code as:
//   node .claude/hooks/capture.js prompt   (UserPromptSubmit)
//   node .claude/hooks/capture.js stop     (Stop)
//   node .claude/hooks/capture.js rebuild <transcript.jsonl>   (manual backfill)
//
// Both hook modes do the same thing: replay the session transcript into
// .agent-logs/<stamp>_<session>.md, appending every entry that has not been
// written yet. Replaying rather than sampling is what makes this correct:
//
//   * The previous version logged only the single last assistant message per
//     turn, so a 25-minute turn with 25 messages and 97 tool calls left one
//     sentence behind. Every message and every tool call is now recorded.
//   * The Stop hook can fire before the final assistant message is flushed to
//     the transcript. Sampling captured the second-to-last message and lost
//     the real ending. Replaying from a cursor means a missed entry is simply
//     picked up by the next hook invocation, and `stop` additionally waits for
//     the file to stop growing.
//
// Never throws past main() - a broken capture script must not block the agent.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2];

/** Longest tool input recorded before truncation. */
const MAX_TOOL_INPUT = 800;
/** How long `stop` waits for the transcript to settle, in ms. */
const SETTLE_TIMEOUT_MS = 3000;
const SETTLE_POLL_MS = 150;

function projectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function logsDir() {
  const dir = path.join(projectDir(), '.agent-logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function logError(err) {
  try {
    fs.appendFileSync(
      path.join(logsDir(), '_hook-errors.log'),
      `${new Date().toISOString()} [${mode}] ${err && err.stack ? err.stack : err}\n`
    );
  } catch {}
}

function getAuthor() {
  try {
    const name = execSync('git config user.name', { cwd: projectDir() }).toString().trim();
    if (name) return name;
  } catch {}
  return 'unknown';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateStampUTC(d) {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`
  );
}

// ---------------------------------------------------------------- transcript

function readTranscript(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  const entries = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // A half-written trailing line is normal while the agent is running.
    }
  }
  return entries;
}

/**
 * Waits for the transcript to stop growing so the turn's final message has
 * landed. Bounded, and returns regardless once the budget is spent.
 */
function waitForSettle(transcriptPath) {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  let previous = -1;
  while (Date.now() < deadline) {
    let size;
    try {
      size = fs.statSync(transcriptPath).size;
    } catch {
      return;
    }
    if (size === previous) return;
    previous = size;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, SETTLE_POLL_MS);
  }
}

function isRealPrompt(entry) {
  if (entry.type !== 'user') return false;
  if (entry.isMeta || entry.isCompactSummary) return false;
  const content = entry.message && entry.message.content;
  if (typeof content === 'string') return content.trim().length > 0;
  if (!Array.isArray(content)) return false;
  // Tool results are also 'user' entries; only genuine typed input counts.
  if (content.some((b) => b.type === 'tool_result')) return false;
  return content.some((b) => b.type === 'text' && b.text && b.text.trim());
}

function promptText(entry) {
  const content = entry.message.content;
  if (typeof content === 'string') return content.trim();
  return content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n\n')
    .trim();
}

function truncate(text, limit) {
  const value = String(text);
  return value.length > limit ? `${value.slice(0, limit)}… [+${value.length - limit} chars]` : value;
}

/** One readable line describing what a tool call actually did. */
function summarizeTool(name, input) {
  const args = input || {};
  switch (name) {
    case 'Bash':
    case 'PowerShell':
      return truncate(args.command || '', MAX_TOOL_INPUT);
    case 'Write':
      return `${args.file_path || '?'} (${(args.content || '').length} chars written)`;
    case 'Edit':
      return `${args.file_path || '?'} (replace ${(args.old_string || '').length} chars → ${(args.new_string || '').length} chars)`;
    case 'Read':
      return `${args.file_path || '?'}${args.offset ? ` from line ${args.offset}` : ''}`;
    case 'Glob':
      return `${args.pattern || ''}${args.path ? ` in ${args.path}` : ''}`;
    case 'Grep':
      return `${args.pattern || ''}${args.path ? ` in ${args.path}` : ''}${args.glob ? ` (${args.glob})` : ''}`;
    case 'Task':
    case 'Agent':
      return `${args.subagent_type || 'agent'}: ${truncate(args.description || args.prompt || '', 200)}`;
    default:
      return truncate(JSON.stringify(args), MAX_TOOL_INPUT);
  }
}

/**
 * Flattens the transcript into the sequence of records worth logging:
 * every typed prompt, every assistant message, every tool call, in order.
 */
function loggableRecords(entries) {
  const records = [];

  for (const entry of entries) {
    const uuid = entry.uuid;
    if (!uuid) continue;
    const timestamp = entry.timestamp || new Date().toISOString();

    if (isRealPrompt(entry)) {
      records.push({
        uuid,
        type: 'PROMPT',
        timestamp,
        model: '',
        sidechain: Boolean(entry.isSidechain),
        body: promptText(entry),
      });
      continue;
    }

    if (entry.type !== 'assistant') continue;
    const message = entry.message;
    if (!message || !Array.isArray(message.content)) continue;
    const model = message.model || '';

    const text = message.content
      .filter((b) => b.type === 'text' && b.text && b.text.trim())
      .map((b) => b.text)
      .join('\n\n')
      .trim();

    if (text) {
      records.push({
        uuid,
        type: 'RESPONSE',
        timestamp,
        model,
        sidechain: Boolean(entry.isSidechain),
        body: text,
      });
    }

    // A message can hold several tool_use blocks; each is its own record, and
    // the uuid is suffixed so the cursor can resume mid-message.
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    toolUses.forEach((block, index) => {
      records.push({
        uuid: `${uuid}#${index}`,
        type: 'TOOL',
        timestamp,
        model,
        sidechain: Boolean(entry.isSidechain),
        name: block.name,
        body: summarizeTool(block.name, block.input),
      });
    });
  }

  return records;
}

// ------------------------------------------------------------------ log file

function findSessionFile(sessionId) {
  const dir = logsDir();
  const match = fs.readdirSync(dir).find((f) => f.endsWith(`_${sessionId}.md`));
  return match ? path.join(dir, match) : null;
}

function createSessionFile(sessionId, timestamp) {
  const stamp = dateStampUTC(new Date(timestamp));
  const file = path.join(logsDir(), `${stamp}_${sessionId}.md`);
  const shortId = sessionId.slice(0, 8);
  const dateOnly = timestamp.slice(0, 10);
  const projectName = path.basename(projectDir());
  const author = getAuthor();

  const frontmatter =
    `---\n` +
    `session_id: ${sessionId}\n` +
    `date: ${dateOnly}\n` +
    `author: ${author}\n` +
    `model: unknown\n` +
    `tool: claude-code\n` +
    `project: ${projectName}\n` +
    `prompts: 0\n` +
    `responses: 0\n` +
    `tool_calls: 0\n` +
    `first_entry_time: ${timestamp}\n` +
    `last_entry_time: ${timestamp}\n` +
    `cursor_uuid: \n` +
    `---\n\n` +
    `# Session Log - ${dateOnly}\n\n` +
    `Session: \`${shortId}\` | Project: \`${projectName}\` | Author: \`${author}\`\n\n` +
    `Every prompt, every assistant message and every tool call, in order.\n\n` +
    `---\n`;

  fs.writeFileSync(file, frontmatter);
  return file;
}

function readField(content, key) {
  const match = content.match(new RegExp(`^${key}: ?(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

function setField(content, key, value) {
  const re = new RegExp(`^${key}: ?.*$`, 'm');
  return re.test(content) ? content.replace(re, `${key}: ${value}`) : content;
}

function countEntries(content, type) {
  return (content.match(new RegExp(`\\[LOG_ENTRY type=${type} `, 'g')) || []).length;
}

function renderRecord(record, num, shortId) {
  const header =
    `\n[LOG_ENTRY type=${record.type} num=${num} session=${shortId}` +
    (record.name ? ` tool=${record.name}` : '') +
    (record.sidechain ? ' sidechain=true' : '') +
    `]\n` +
    `timestamp: ${record.timestamp}\n` +
    (record.model ? `model: ${record.model}\n` : '');

  if (record.type === 'TOOL') {
    return `${header}\n\`\`\`\n${record.body}\n\`\`\`\n\n`;
  }
  return `${header}\n${record.body}\n\n`;
}

/**
 * Appends every record the log does not already have. The cursor is the uuid
 * of the last record written; anything at or before it is skipped.
 */
function sync(sessionId, transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return;

  const records = loggableRecords(readTranscript(transcriptPath));
  if (!records.length) return;

  let file = findSessionFile(sessionId);
  if (!file) file = createSessionFile(sessionId, records[0].timestamp);

  let content = fs.readFileSync(file, 'utf8');
  const cursor = readField(content, 'cursor_uuid');

  let startIndex = 0;
  if (cursor) {
    const found = records.findIndex((r) => r.uuid === cursor);
    // A cursor that no longer resolves means the transcript was rewritten;
    // appending everything would duplicate, so wait for a rebuild instead.
    if (found === -1) return;
    startIndex = found + 1;
  }

  const pending = records.slice(startIndex);
  if (!pending.length) return;

  const shortId = sessionId.slice(0, 8);
  const counts = {
    PROMPT: countEntries(content, 'PROMPT'),
    RESPONSE: countEntries(content, 'RESPONSE'),
    TOOL: countEntries(content, 'TOOL'),
  };

  let appended = '';
  for (const record of pending) {
    counts[record.type] += 1;
    appended += renderRecord(record, counts[record.type], shortId);
  }

  content += appended;

  const last = pending[pending.length - 1];
  content = setField(content, 'cursor_uuid', last.uuid);
  content = setField(content, 'last_entry_time', last.timestamp);
  content = setField(content, 'prompts', counts.PROMPT);
  content = setField(content, 'responses', counts.RESPONSE);
  content = setField(content, 'tool_calls', counts.TOOL);

  if (readField(content, 'model') === 'unknown') {
    const withModel = pending.find((r) => r.model);
    if (withModel) content = setField(content, 'model', withModel.model);
  }

  fs.writeFileSync(file, content);
}

/** Deletes a session's log and regenerates it from the transcript. */
function rebuild(transcriptPath) {
  const entries = readTranscript(transcriptPath);
  const sessionId =
    (entries.find((e) => e.sessionId) || {}).sessionId ||
    path.basename(transcriptPath, '.jsonl');

  const existing = findSessionFile(sessionId);
  if (existing) fs.unlinkSync(existing);

  sync(sessionId, transcriptPath);

  const file = findSessionFile(sessionId);
  if (!file) {
    console.log(`No loggable records found in ${transcriptPath}`);
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  console.log(
    `Rebuilt ${path.relative(projectDir(), file)}: ` +
      `${readField(content, 'prompts')} prompts, ` +
      `${readField(content, 'responses')} responses, ` +
      `${readField(content, 'tool_calls')} tool calls`
  );
}

function main(data) {
  if (mode === 'rebuild') {
    const target = process.argv[3];
    if (!target) throw new Error('rebuild needs a transcript path');
    rebuild(target);
    return;
  }

  const sessionId = data.session_id || 'unknown-session';
  const transcriptPath = data.transcript_path;

  // On stop, give the final assistant message a moment to reach the file.
  if (mode === 'stop' && transcriptPath && fs.existsSync(transcriptPath)) {
    waitForSettle(transcriptPath);
  }

  sync(sessionId, transcriptPath);
}

if (mode === 'rebuild') {
  try {
    main({});
  } catch (err) {
    logError(err);
    console.error(err.message);
    process.exit(1);
  }
} else {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    try {
      main(JSON.parse(input || '{}'));
    } catch (err) {
      logError(err);
    }
  });
}
