import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CONFIG } from "../config.js";

/** Painel de Tickets (compatível com Forum) */
export async function sendTicketPanel(client, channelOverride = null) {
  try {
    const channel = channelOverride
      ? (typeof channelOverride === "string" ? await client.channels.fetch(channelOverride) : channelOverride)
      : (CONFIG.CHANNELS.VERIFICATION ? await client.channels.fetch(CONFIG.CHANNELS.VERIFICATION) : null);

    if (!channel) return { ok: false, reason: "Canal não encontrado" };
    const isForum = channel.type === 15; // GuildForum
    const isText = channel.isTextBased?.();

    if (!isText && !isForum) return { ok: false, reason: "Canal inválido para tickets" };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_doacoes").setLabel("💰 Doações").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_suporte").setLabel("🛠️ Suporte Técnico").setStyle(ButtonStyle.Primary)
    );

    if (isForum) {
      const thread = await channel.threads.create({
        name: "Abrir Ticket",
        message: { content: "**Central de Atendimentos — Black**\nAbra um ticket e nossa staff irá ajudá-lo.", components: [row] }
      });
      console.log("[BLACKBOT] Painel de tickets enviado (Forum) em", `#${channel.name}`);
      return { ok: true, threadId: thread.id, channelId: channel.id };
    } else {
      const msg = await channel.send({ content: "**Central de Atendimentos — Black**\nAbra um ticket e nossa staff irá ajudá-lo.", components: [row] });
      console.log("[BLACKBOT] Painel de tickets enviado em", `#${channel.name}`);
      return { ok: true, messageId: msg.id, channelId: channel.id };
    }
  } catch (err) {
    console.error("[BLACKBOT:ERR] Falha ao enviar painel de tickets:", err);
    return { ok: false, reason: err?.message || "Erro desconhecido" };
  }
}
