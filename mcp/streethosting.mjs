import readline from 'node:readline';

const baseUrl = process.env.STREETHOSTING_API_URL || 'https://cloud.streethosting.com.br/api';
const token = process.env.STREETHOSTING_API_TOKEN;

if (!token) throw new Error('STREETHOSTING_API_TOKEN não configurado');

async function api(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`StreetHosting HTTP ${response.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

function reply(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

const tools = [
  { name: 'get_account', description: 'Consulta os dados da conta StreetHosting.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_servers', description: 'Lista os servidores da conta StreetHosting.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_server', description: 'Consulta um servidor pelo ID.', inputSchema: { type: 'object', properties: { serverId: { type: 'string' } }, required: ['serverId'] } },
];

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  let request;
  try {
    request = JSON.parse(line);
    if (request.method === 'initialize') {
      reply(request.id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'streethosting-readonly', version: '1.0.0' } });
    } else if (request.method === 'notifications/initialized') {
      return;
    } else if (request.method === 'tools/list') {
      reply(request.id, { tools });
    } else if (request.method === 'tools/call') {
      const { name, arguments: args = {} } = request.params;
      const data = name === 'get_account' ? await api('/account') : name === 'list_servers' ? await api('/server') : name === 'get_server' ? await api(`/server/${encodeURIComponent(args.serverId)}`) : null;
      if (data === null) throw new Error(`Ferramenta não permitida: ${name}`);
      reply(request.id, { content: [{ type: 'text', text: JSON.stringify(data) }] });
    } else if (request.id !== undefined) {
      reply(request.id, { error: { code: -32601, message: 'Método não suportado' } });
    }
  } catch (error) {
    if (request?.id !== undefined) reply(request.id, { content: [{ type: 'text', text: `Erro: ${error.message}` }], isError: true });
  }
});
