export const CONFIG = {
  // Canais (ajuste conforme seu Discord)
  CHANNELS: {
    VERIFICACAO: "1401950755031748628", // destino inicial RP (questionário/whitelist)
    PVE_REGISTRO: "1401951160629461002", // canal para cadastro PVE (SteamID)
    STAFF_ANALISE_RP: "1401951752055427152", // canal interno de staff para análise da whitelist RP
    ESPERA_RP: "1402205533272014858", // canal de espera após envio da whitelist
    REPROVADOS_RP: "1402206198668853299", // canal para reprovação RP
    LOG_PVE: "1402195335048204298", // log do cadastro PVE (SteamID, usuário, data/hora)
    INFO_COMMAND_CHANNEL: "1402172138395271239" // canal permitido para /info
  },

  // Cargos (ajuste os nomes exatos no seu servidor)
  ROLES: {
    BASE: "Sobrevivente",
    RP: "Sobrevivente RP",
    PVE: "Sobrevivente PVE"
  },

  // Texto do painel
  TEXTS: {
    VERIFICACAO_TITULO: "Bem-vindo ao **Black**",
    VERIFICACAO_DESC: "Escolha abaixo para iniciar seu acesso: RP (whitelist) ou PVE (SteamID).",
    TICKETS_TITULO: "Central de Atendimentos — Black",
    TICKETS_DESC: "Abra um ticket e nossa staff irá ajudá-lo."
  }
};
