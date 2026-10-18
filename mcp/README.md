# MCP StreetHosting (somente leitura)

Este adaptador expõe `get_account`, `list_servers` e `get_server` via MCP/stdio.
O token nunca fica no código.

Configure `STREETHOSTING_API_URL` e `STREETHOSTING_API_TOKEN` no ambiente do usuário que executará o MCP e registre o comando no Codex apontando para `mcp/streethosting.mjs`.

Não adicione ferramentas de reinício, desligamento ou alteração sem revisão e aprovação explícita.
