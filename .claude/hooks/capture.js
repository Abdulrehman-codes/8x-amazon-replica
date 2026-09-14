#!/usr/bin/env node
// 8x assignment capture hook. Invoked by Claude Code as:
//   node .claude/hooks/capture.js prompt   (UserPromptSubmit)
//   node .claude/hooks/capture.js stop     (Stop)
// Reads the hook JSON payload from stdin, appends one LOG_ENTRY to the
// session's file under .agent-logs/. Never throws past main() - a broken
// capture script must not block Claude Code.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2];

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
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`;
}

function findSessionFile(sessionId) {
  const dir = logsDir();
  const match = fs.readdirSync(dir).find((f) => f.endsWith(`_${sessionId}.md`));
  return match ? path.join(dir, match) : null;
}

function createSessionFile(sessionId, model, timestamp) {
  const dir = logsDir();
  const stamp = dateStampUTC(new Date(timestamp));
  const file = path.join(dir, `${stamp}_${sessionId}.md`);
  const shortId = sessionId.slice(0, 8);
  const dateOnly = timestamp.slice(0, 10);
  const projectName = path.basename(projectDir());
  const author = getAuthor();
  const frontmatter =
    `---\n` +
    `session_id: ${sessionId}\n` +
    `date: ${dateOnly}\n` +
    `author: ${author}\n` +
    `model: ${model}\n` +
    `tool: claude-code\n` +
    `project: ${projectName}\n` +
    `total_exchanges: 0\n` +
    `first_prompt_time: ${timestamp}\n` +
    `last_prompt_time: ${timestamp}\n` +
    `---\n\n` +
    `# Session Log - ${dateOnly}\n\n` +
    `Session: \`${shortId}\` | Project: \`${projectName}\` | Author: \`${author}\`\n\n` +
    `---\n`;
  fs.writeFileSync(file, frontmatter);
  return file;
}

function countEntries(content, type) {
  const re = new RegExp(`\\[LOG_ENTRY type=${type} `, 'g');
  return (content.match(re) || []).length;
}

function setFrontmatterField(content, key, value) {
  const re = new RegExp(`^${key}: .*$`, 'm');
  if (re.test(content)) return content.replace(re, `${key}: ${value}`);
  return content;
}

function extractModelFromTranscript(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let obj;
      try {
        obj = JSON.parse(lines[i]);
      } catch {
        continue;
      }
      const m = obj && obj.message && obj.message.model;
      if (m) return m;
    }
  } catch {}
  return 'unknown';
}

function lastAssistantFinalText(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let e;
    try {
      e = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (e.type === 'assistant' && e.message && Array.isArray(e.message.content)) {
      const textBlocks = e.message.content.filter((b) => b.type === 'text').map((b) => b.text);
      if (textBlocks.length) {
        return { text: textBlocks.join('\n\n'), model: e.message.model || 'unknown' };
      }
    }
  }
  return { text: '', model: 'unknown' };
}

function appendEntry(sessionId, type, timestamp, model, body) {
  let file = findSessionFile(sessionId);
  if (!file) file = createSessionFile(sessionId, model, timestamp);
  let content = fs.readFileSync(file, 'utf8');
  const num = countEntries(content, type) + 1;
  const shortId = sessionId.slice(0, 8);
  const entry =
    `\n[LOG_ENTRY type=${type} num=${num} session=${shortId}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model}\n\n` +
    `${body}\n\n`;
  content += entry;
  content = setFrontmatterField(content, 'last_prompt_time', timestamp);
  if (type === 'RESPONSE') {
    content = setFrontmatterField(content, 'total_exchanges', num);
    content = setFrontmatterField(content, 'model', model);
  }
  fs.writeFileSync(file, content);
}

function main(data) {
  const sessionId = data.session_id || 'unknown-session';
  const timestamp = new Date().toISOString();

  if (mode === 'prompt') {
    const prompt = typeof data.prompt === 'string' ? data.prompt : '';
    let model = 'unknown';
    if (data.transcript_path && fs.existsSync(data.transcript_path)) {
      model = extractModelFromTranscript(data.transcript_path);
    }
    appendEntry(sessionId, 'PROMPT', timestamp, model, prompt);
  } else if (mode === 'stop') {
    if (!data.transcript_path || !fs.existsSync(data.transcript_path)) return;
    const { text, model } = lastAssistantFinalText(data.transcript_path);
    if (!text) return;
    appendEntry(sessionId, 'RESPONSE', timestamp, model, text);
  }
}

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
