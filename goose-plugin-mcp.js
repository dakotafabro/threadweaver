#!/usr/bin/env node
let buffer = '';
function writeMessage(message) {
  const body = JSON.stringify(message);
  const header = 'Content-Length: ' + Buffer.byteLength(body, 'utf8') + '\r\n\r\n';
  process.stdout.write(header + body);
}
function sendResult(id, result) {
  writeMessage({ jsonrpc: '2.0', id, result });
}
function sendError(id, code, message) {
  writeMessage({ jsonrpc: '2.0', id, error: { code, message } });
}
function toolResponse(text, isError) {
  return { content: [{ type: 'text', text }], isError: !!isError };
}
function handleRequest(msg) {
  if (!msg || typeof msg !== 'object') return;
  const method = msg.method;
  const id = msg.id;
  if (method === 'initialize') {
    sendResult(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'threadweaver', version: '0.1.0' } });
    return;
  }
  if (method === 'notifications/initialized') return;
  if (method === 'tools/list') {
    sendResult(id, { tools: [{ name: 'threadweaver_status', description: 'Show Threadweaver plugin status and setup guidance', inputSchema: { type: 'object', additionalProperties: false, properties: {} } }] });
    return;
  }
  if (method === 'tools/call') {
    const name = msg.params && msg.params.name;
    if (name !== 'threadweaver_status') {
      sendResult(id, toolResponse('Unknown tool: ' + String(name || ''), true));
      return;
    }
    const text = 'Threadweaver Goose plugin is installed. This lightweight MCP entrypoint confirms plugin wiring. Replace goose-plugin-mcp.js to expose full Threadweaver recall tools.';
    sendResult(id, toolResponse(text, false));
    return;
  }
  if (id !== undefined) sendError(id, -32601, 'Method not found: ' + String(method || ''));
}
function processBuffer() {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;
    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buffer = ''; return; }
    const length = Number(match[1]);
    const total = headerEnd + 4 + length;
    if (buffer.length < total) return;
    const body = buffer.slice(headerEnd + 4, total);
    buffer = buffer.slice(total);
    try { handleRequest(JSON.parse(body)); } catch (_) {}
  }
}
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { buffer += chunk; processBuffer(); });
process.stdin.on('end', () => process.exit(0));