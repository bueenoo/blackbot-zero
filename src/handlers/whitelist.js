import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, ChannelType, PermissionFlagsBits
} from "discord.js";
import { CONFIG } from "../config.js";

/** Painel de boas-vindas (suporta Forum) */
export async function sendWelcomePanel(client, channelOverride = null) {
  const channelId = channelOverride || CONFIG.WELCOME_CHANNEL_ID;
  if (!channelId) return { ok: false, reason: "WELCOME_CHANNEL_ID não configurado" };
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch) return { ok: false, reason: "Canal não encontrado" };

  const emb = new EmbedBuilder()
    .setTitle("Bem-vindo(a) ao Black!")
    .setDescription("Escolha abaixo o **servidor** que deseja jogar.\n\n▶️ **RP** abre a Whitelist para preencher.\n\nSe precisar de ajuda, abra um **ticket** no canal de suporte.")
    .setColor(0x2b2d31);

  const img = process.env.WELCOME_IMAGE_URL?.trim();
  if (img) emb.setImage(img);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("wl_start").setLabel("🎭 Jogar no Black RP (WL)").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("pve_info").setLabel("🛡️ Jogar no PVE").setStyle(ButtonStyle.Secondary)
  );

  const isForum = ch.type === ChannelType.GuildForum;
  if (ch.isTextBased?.()) {
    await ch.send({ embeds: [emb], components: [row] });
    return { ok: true, channelId: ch.id };
  }
  if (isForum) {
    const thread = await ch.threads.create({ name: "Boas-vindas", message: { embeds: [emb], components: [row] } });
    return { ok: true, channelId: ch.id, threadId: thread.id };
  }
  return { ok: false, reason: "Canal inválido para boas-vindas" };
}

/** Abrir modal de WL */
export async function handleWlStart(interaction) {
  const modal = new ModalBuilder().setCustomId("wl_modal").setTitle("Nova WL • PT");
  const nome = new TextInputBuilder().setCustomId("wl_nome").setLabel("Nome").setStyle(TextInputStyle.Short).setRequired(true);
  const idade = new TextInputBuilder().setCustomId("wl_idade").setLabel("Idade").setStyle(TextInputStyle.Short).setRequired(true);
  const steam = new TextInputBuilder().setCustomId("wl_steam").setLabel("Steam ID").setStyle(TextInputStyle.Short).setRequired(true);
  const exp   = new TextInputBuilder().setCustomId("wl_exp").setLabel("Experiência RP (Sim/Não)").setStyle(TextInputStyle.Short).setRequired(true);
  const hist  = new TextInputBuilder().setCustomId("wl_hist").setLabel("História (até 1000 caracteres)").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(idade),
    new ActionRowBuilder().addComponents(steam),
    new ActionRowBuilder().addComponents(exp),
    new ActionRowBuilder().addComponents(hist)
  );
  await interaction.showModal(modal);
}

/** Resolve categoria->texto e retorna canal de Texto ou Fórum */
async function resolveTextOrForum(guild, configuredId, createName, staffRoleId) {
  const ch = await guild.channels.fetch(configuredId).catch(() => null);
  if (!ch) return null;

  if (ch.type === ChannelType.GuildCategory) {
    // Procura um canal de texto existente
    const candidate = guild.channels.cache.find(c => c.parentId === ch.id && (c.type === ChannelType.GuildText || c.isTextBased?.()));
    if (candidate) return candidate;
    // Cria um novo
    const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
    if (staffRoleId) overwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    const created = await guild.channels.create({
      name: createName,
      type: ChannelType.GuildText,
      parent: ch.id,
      permissionOverwrites: overwrites
    }).catch(() => null);
    return created;
  }
  return ch;
}

/** Envia a WL para o canal da staff (texto, fórum ou categoria->texto) */
export async function handleWlSubmit(interaction) {
  const uid = interaction.user.id;
  const nome = interaction.fields.getTextInputValue("wl_nome");
  const idade = interaction.fields.getTextInputValue("wl_idade");
  const steam = interaction.fields.getTextInputValue("wl_steam");
  const exp   = interaction.fields.getTextInputValue("wl_exp");
  const hist  = interaction.fields.getTextInputValue("wl_hist");

  const reviewId = CONFIG.WL_STAFF_REVIEW_CHANNEL_ID;
  const ch = await resolveTextOrForum(interaction.guild, reviewId, "wl-review", process.env.STAFF_ROLE_ID);
  if (!ch) {
    return interaction.reply({ content: "❌ Canal de review não encontrado. Verifique WL_STAFF_REVIEW_CHANNEL_ID.", flags: MessageFlags.Ephemeral });
  }

  const emb = new EmbedBuilder()
    .setTitle("Nova WL • PT")
    .setDescription(`**Usuário**\n<@${uid}> ( \`${uid}\` )\n\n**Nome**\n${nome}\n\n**Idade**\n${idade}\n\n**Discord ID**\n${uid}\n\n**Steam ID**\n${steam}\n\n**Experiência RP**\n${exp}\n\n**História**\n${hist}\n\nLang=PT`)
    .setColor(0x5865f2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`wl_approve:${uid}`).setLabel("✅ Aprovar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`wl_reject:${uid}`).setLabel("❌ Reprovar").setStyle(ButtonStyle.Danger)
  );

  try {
    if (ch.isTextBased?.()) {
      await ch.send({ embeds: [emb], components: [row] });
    } else if (ch.type === ChannelType.GuildForum) {
      await ch.threads.create({ name: `WL • ${interaction.user.username} (${uid})`, message: { embeds: [emb], components: [row] } });
    } else {
      return interaction.reply({ content: "❌ Canal de review não é texto nem fórum. Troque para um canal compatível.", flags: MessageFlags.Ephemeral });
    }
  } catch (e) {
    console.warn("[WL] Falha ao enviar WL no canal de review:", e?.message);
    return interaction.reply({ content: `❌ Sem permissão para enviar no canal ${reviewId}.`, flags: MessageFlags.Ephemeral });
  }

  return interaction.reply({ content: "✅ Sua WL foi enviada para análise.", flags: MessageFlags.Ephemeral });
}

/** Aprovar: dá cargo e avisa no canal configurado (aceita texto/fórum/categoria->texto) */
export async function approveWl(interaction, targetUserId) {
  if (process.env.STAFF_ROLE_ID && !interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
    return interaction.reply({ content: "❌ Somente a Staff pode aprovar WL.", flags: MessageFlags.Ephemeral });
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const member = await interaction.guild.members.fetch(targetUserId);
    const roleId = process.env.WL_APPROVED_ROLE_ID;
    if (roleId) {
      await member.roles.add(roleId).catch(err => {
        console.warn("[WL] Falha ao dar cargo:", err?.message);
        throw new Error("Sem permissão para dar cargo (verifique hierarquia do cargo do bot).");
      });
    }

    const notifyId = process.env.WL_NOTIFY_APPROVED_CHANNEL_ID;
    if (notifyId) {
      const c = await resolveTextOrForum(interaction.guild, notifyId, "wl-aprovados", process.env.STAFF_ROLE_ID);
      if (c) {
        const payload = {
          content: `🎉 Parabéns <@${targetUserId}>! Sua **Whitelist** foi **aprovada**!`,
          embeds: [{ image: { url: process.env.CONGRATS_GIF_URL || "https://media.tenor.com/6zvG7v0QF0cAAAAC/dayz.gif" }, color: 0x57f287 }]
        };
        if (c.isTextBased?.()) await c.send(payload);
        else if (c.type === ChannelType.GuildForum) await c.threads.create({ name: `WL aprovada - ${targetUserId}`, message: payload });
      }
    }
    await interaction.editReply("✅ WL aprovada.");
  } catch (e):
    console.error("[WL approve] Erro:", e?.message);
    await interaction.editReply("❌ Não consegui aprovar. Verifique permissões/cargo (hierarquia) e IDs de canais.");
}

/** Reprovar: coleta motivo e avisa no canal configurado (aceita texto/fórum/categoria->texto) */
export async function openRejectModal(interaction, targetUserId) {
  if (process.env.STAFF_ROLE_ID && !interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
    return interaction.reply({ content: "❌ Somente a Staff pode reprovar WL.", flags: MessageFlags.Ephemeral });
  }
  const modal = new ModalBuilder().setCustomId(`wl_reject_reason:${targetUserId}`).setTitle("Motivo da reprovação");
  const reason = new TextInputBuilder().setCustomId("wl_reason").setLabel("Explique o motivo").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
  modal.addComponents(new ActionRowBuilder().addComponents(reason));
  await interaction.showModal(modal);
}

export async function submitRejectReason(interaction, targetUserId) {
  const reason = interaction.fields.getTextInputValue("wl_reason");
  const redo = process.env.WELCOME_CHANNEL_ID ? `<#${process.env.WELCOME_CHANNEL_ID}>` : "o canal de entrada";
  const notifyId = process.env.WL_NOTIFY_REJECTED_CHANNEL_ID;

  try {
    if (notifyId) {
      const c = await resolveTextOrForum(interaction.guild, notifyId, "wl-reprovados", process.env.STAFF_ROLE_ID);
      const payload = { content: `⚠️ <@${targetUserId}> sua **WL foi reprovada**.
**Motivo:** ${reason}
Por favor, refaça sua WL em ${redo}.` };
      if (c?.isTextBased?.()) await c.send(payload);
      else if (c?.type === ChannelType.GuildForum) await c.threads.create({ name: `WL reprovada - ${targetUserId}`, message: payload });
    }
    await interaction.reply({ content: "✅ Reprovação enviada.", flags: MessageFlags.Ephemeral });
  } catch (e):
    console.error("[WL reject] Erro:", e?.message);
    await interaction.reply({ content: "❌ Não consegui enviar a reprovação. Verifique permissões/IDs.", flags: MessageFlags.Ephemeral });
}
