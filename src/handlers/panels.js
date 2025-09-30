
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CONFIG } from "../config.js";

export async function sendTicketPanel(client, channelOverride = null) {
  try {
    const channel = channelOverride
      ? (typeof channelOverride === "string" ? await client.channels.fetch(channelOverride) : channelOverride)
      : (CONFIG.CHANNELS.VERIFICATION ? await client.channels.fetch(CONFIG.CHANNELS.VERIFICATION) : null);

    if (!channel || !channel.isTextBased()) {
      console.warn("[BLACKBOT:WARN] Canal alvo inválido para o painel de tickets.");
      return { ok: false, reason: "Canal inválido" };
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_doacoes").setLabel("💰 Doações").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_suporte").setLabel("🛠️ Suporte Técnico").setStyle(ButtonStyle.Primary)
    );

    const msg = await channel.send({ content: "**Central de Atendimentos — Black**\nAbra um ticket e nossa staff irá ajudá-lo.", components: [row] });
    console.log("[BLACKBOT] Painel de tickets enviado em", `#${channel.name}`);
    return { ok: true, messageId: msg.id, channelId: channel.id };
  } catch (err) {
    console.error("[BLACKBOT:ERR] Falha ao enviar painel de tickets:", err);
    return { ok: false, reason: err?.message || "Erro desconhecido" };
  }
}
