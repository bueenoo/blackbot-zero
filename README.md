# Blackbot Zero (v3)

Bot de Discord **do zero**, pronto para Railway/GitHub.

## Funcionalidades
- Mensagem de verificação com botões **Black RP** e **Black PVE**.
- **Whitelist RP** via *modal*, envio automático ao canal de análise com botões **Aprovar/Reprovar** e motivo.
- **Cadastro PVE** com validação de **SteamID64**, atribuição de cargo e **log** com data/hora.
- Painel de **Tickets** (💰 Doações, 🚨 Denúncia, ⚙️ Suporte Técnico) abrindo *threads* privadas com o autor.
- Comando **/info** (IP dos servidores + contagem de membros online).
- IDs dos canais importantes já prontos para você ajustar em `src/config.js`.

## Requisitos
- Node 18+
- Criar um **Bot** no Discord Developer Portal e adicionar ao seu servidor
  - Scopes: `bot` e `applications.commands`
  - Permissões sugeridas: **Manage Roles**, **Manage Threads**, **Create Public Threads**, **Send Messages**, **Read Message History**, **Attach Files**, **Use Application Commands**.

## Variáveis de Ambiente (.env)
Veja `.env.example`.

## Deploy no Railway
- Conecte seu GitHub com este projeto.
- Configure as variáveis de ambiente.
- *Build* automático; *start* usa `npm start`.

Última geração: 2025-09-29T18:59:08.095420
