import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "../config.js";

/**
 * Envia um painel simples de verificacão (opcional).
 * Ajuste o canal via VERIFICATION_CHANNEL_ID no .env.
 */
export async function sendVerificationPanel(client) {
  try {
    if (!CONFIG.CHANNELS.VERIFICATION) return;

    const channel = await client.channels.fetch(CONFIG.CHANNELS.VERIFICATION);
    if (!channel || !channel.isTextBased()) {
      console.warn("[BLACKBOT:WARN] Canal de verificação não é de texto ou não existe.");
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("open_ticket_doacoes").setLabel("💰 Doações").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("open_ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("open_ticket_suporte").setLabel("⚙️ Suporte Técnico").setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ content: "🎫 **Abra um ticket privado** selecionando uma opção abaixo:", components: [row] });
    console.log("[BLACKBOT] Painel de verificação enviado.");
  } catch (err) {
    console.error("[BLACKBOT:ERR] Falha ao enviar painel de verificação:", err);
  }
}
