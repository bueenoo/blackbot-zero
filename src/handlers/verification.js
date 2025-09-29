import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { log, warn } from "../utils/logger.js";
import { pickTextTarget } from "../utils/textTarget.js";

export async function sendVerificationPanel(channel) {
  const target = pickTextTarget(channel);
  if (!target) {
    warn("Canal de verificação não é de texto. Ajuste via /setchannels.");
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle("Bem-vindo ao **Black**")
    .setDescription("Escolha abaixo para iniciar seu acesso: RP (whitelist) ou PVE (SteamID).")
    .setColor(0x111111);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("black_rp").setLabel("Black RP").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("black_pve").setLabel("Black PVE").setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("tickets_panel").setLabel("Abrir Painel de Tickets").setStyle(ButtonStyle.Success)
  );
  await target.send({ embeds: [embed], components: [row, row2] });
  log("Painel de verificação enviado.");
}

export function buildWhitelistModal() {
  const modal = new ModalBuilder().setCustomId("modal_whitelist_rp").setTitle("Whitelist RP — Black");
  const nome = new TextInputBuilder().setCustomId("wl_nome").setLabel("Nome").setStyle(TextInputStyle.Short).setRequired(true);
  const idade = new TextInputBuilder().setCustomId("wl_idade").setLabel("Idade").setStyle(TextInputStyle.Short).setRequired(true);
  const steam = new TextInputBuilder().setCustomId("wl_steamid").setLabel("Steam ID (64)").setStyle(TextInputStyle.Short).setRequired(true);
  const exp = new TextInputBuilder().setCustomId("wl_exp").setLabel("Experiência com RP (Sim/Não)").setStyle(TextInputStyle.Short).setRequired(true);
  const historia = new TextInputBuilder().setCustomId("wl_hist").setLabel("História do personagem (até 250 chars)").setStyle(TextInputStyle.Paragraph).setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(idade),
    new ActionRowBuilder().addComponents(steam),
    new ActionRowBuilder().addComponents(exp),
    new ActionRowBuilder().addComponents(historia),
  );
  return modal;
}
