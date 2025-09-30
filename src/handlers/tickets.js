
import { ChannelType, PermissionFlagsBits, MessageFlags, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CONFIG } from "../config.js";

function reply(interaction, mode, text) {
  if (mode === "reply") return interaction.editReply(text);
  return interaction.user.send(text).catch(() => {});
}

export async function openTicket(interaction, tipo) {
  let mode = "reply";
  try {
    const me = interaction.client.user?.id;
    const canSendHere = interaction.channel?.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages);
    try {
      if (interaction.isButton() && !canSendHere) { await interaction.deferUpdate(); mode = "update"; }
      else { await interaction.deferReply({ flags: MessageFlags.Ephemeral }); mode = "reply"; }
    } catch { try { await interaction.deferUpdate(); mode = "update"; } catch {} }

    const guild = interaction.guild;
    if (!guild) return reply(interaction, mode, "❌ Não consegui identificar o servidor.");
    const categoryId = CONFIG.TICKETS_CATEGORY_ID;
    const category = await guild.channels.fetch(categoryId).catch(() => null);
    if (!category) return reply(interaction, mode, "❌ Categoria de tickets não encontrada. Verifique TICKETS_CATEGORY_ID.");
    if (category.type !== ChannelType.GuildCategory) return reply(interaction, mode, "❌ O ID informado não é uma **Categoria**. Use uma categoria normal (não fórum).");

    const channelName = `ticket-${tipo}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 90);
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: `opener:${interaction.user.id}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] }
      ]
    });
    await channel.setParent(categoryId, { lockPermissions: false });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Fechar").setStyle(ButtonStyle.Secondary)
    );
    await channel.send({ content: `👋 Olá <@${interaction.user.id}>, que bom que você está aqui!\n\nEm breve um membro da nossa **staff** vai te auxiliar.\n👉 Descreva por favor **o que você necessita** e, se tiver algum **anexo**, já nos envie.`, components: [row] });

    // Aviso staff (Forum ok)
    if (CONFIG.STAFF_ALERT_CHANNEL_ID) {
      try {
        const alertCh = await guild.channels.fetch(CONFIG.STAFF_ALERT_CHANNEL_ID);
        const payload = { content: `🆕 **Ticket aberto** (${tipo}) por <@${interaction.user.id}> em <#${channel.id}>` };
        if (alertCh?.isTextBased?.()) await alertCh.send(payload);
        else if (alertCh?.type === ChannelType.GuildForum) await alertCh.threads.create({ name: `Ticket - ${interaction.user.username}`, message: payload });
      } catch (e) { console.warn("[TICKETS] Falha ao avisar staff:", e?.message); }
    }

    return reply(interaction, mode, `✅ Seu ticket foi aberto: ${channel}`);
  } catch (err) {
    console.error("[TICKETS:ERR openTicket]", err);
    return reply(interaction, mode, "❌ Erro ao abrir o ticket. Verifique permissões e a categoria.");
  }
}

export async function closeTicket(interaction) {
  try {
    const ch = interaction.channel;
    if (!ch || ch.type !== ChannelType.GuildText || !ch.name?.startsWith("ticket-")) {
      return interaction.reply({ content: "❌ Este comando só pode ser usado dentro do canal do ticket.", flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const openerId = ch.topic && ch.topic.startsWith("opener:") ? ch.topic.split(":")[1] : null;
    const member = await ch.guild.members.fetch(interaction.user.id).catch(() => null);
    const isStaff = CONFIG.STAFF_ROLE_ID && member && member.roles.cache.has(CONFIG.STAFF_ROLE_ID);
    const isOpener = openerId ? (interaction.user.id === openerId) : true;
    if (!isStaff && !isOpener) return interaction.editReply("❌ Somente o autor do ticket ou a Staff podem fechar este ticket.");

    let all = [];
    let lastId = undefined;
    while (true) {
      const fetched = await ch.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
      if (!fetched || fetched.size === 0) break;
      all.push(...Array.from(fetched.values()));
      lastId = fetched.last().id;
      if (fetched.size < 100) break;
    }
    all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const header = [
      `Ticket: #${ch.name}`,
      `Servidor: ${ch.guild.name}`,
      `Fechado por: ${interaction.user.tag} (${interaction.user.id})`,
      `Data: ${new Date().toISOString()}`,
      ""
    ].join("\n");
    const body = all.map(m => {
      const ts = new Date(m.createdTimestamp).toISOString();
      const who = m.author?.tag || "Desconhecido";
      const at = m.attachments?.size ? " [anexos: " + [...m.attachments.values()].map(a => a.url).join(" ") + "]" : "";
      return `[${ts}] ${who}: ${m.content || ""}${at}`;
    }).join("\n");
    const buf = Buffer.from(header + body, "utf-8");
    const file1 = new AttachmentBuilder(buf, { name: `${ch.name}-transcript.txt` });
    const file2 = new AttachmentBuilder(Buffer.from(buf), { name: `${ch.name}-transcript.txt` });

    try {
      const openerUser = openerId ? await ch.guild.members.fetch(openerId).then(m => m.user).catch(() => null) : null;
      const target = openerUser || interaction.user;
      await target.send({ content: "📄 Aqui está a cópia do seu ticket. Obrigado por entrar em contato!", files: [file1] });
    } catch {}

    if (CONFIG.TICKET_TRANSCRIPTS_CHANNEL_ID) {
      try {
        const logCh = await ch.guild.channels.fetch(CONFIG.TICKET_TRANSCRIPTS_CHANNEL_ID);
        const payload = { content: `📄 **Transcrição de <#${ch.id}>**`, files: [file2] };
        if (logCh?.isTextBased?.()) await logCh.send(payload);
        else if (logCh?.type === ChannelType.GuildForum) await logCh.threads.create({ name: `Transcrição ${ch.name}`, message: payload });
      } catch (e) { console.warn("[TICKETS] Falha ao enviar transcrição:", e?.message); }
    }

    await interaction.editReply("✅ Ticket fechado. O canal será removido.");
    await ch.delete().catch(() => {});
  } catch (err) {
    console.error("[TICKETS:ERR closeTicket]", err);
    try { await interaction.editReply("❌ Erro ao fechar o ticket."); } catch {}
  }
}
