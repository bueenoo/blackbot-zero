import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { CONFIG } from "../config.js";
import { isValidSteamId64, clampText } from "../utils/validate.js";

export async function handleWhitelistModal(interaction) {
  const nome = interaction.fields.getTextInputValue("wl_nome");
  const idade = interaction.fields.getTextInputValue("wl_idade");
  const steam = interaction.fields.getTextInputValue("wl_steamid");
  const exp = interaction.fields.getTextInputValue("wl_exp");
  const hist = clampText(interaction.fields.getTextInputValue("wl_hist"), 250);

  if (!isValidSteamId64(steam)) {
    return interaction.reply({ ephemeral: true, content: "SteamID64 inválido. Deve começar com 7656 e ter 17 dígitos." });
  }

  // envia para canal staff com aprovar/reprovar
  const staffChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.STAFF_ANALISE_RP);
  if (!staffChannel) {
    return interaction.reply({ ephemeral: true, content: "Canal de análise não encontrado. Avise a administração." });
  }

  const embed = new EmbedBuilder()
    .setTitle("Análise — Whitelist RP (Black)")
    .addFields(
      { name: "Jogador", value: `${interaction.user} (id: ${interaction.user.id})` },
      { name: "Nome", value: nome, inline: true },
      { name: "Idade", value: idade, inline: true },
      { name: "SteamID64", value: steam, inline: false },
      { name: "Experiência", value: exp, inline: true },
      { name: "História", value: hist, inline: false }
    )
    .setTimestamp(new Date())
    .setColor(0x202020);

  const approve = new ButtonBuilder()
    .setCustomId(`wl_approve:${interaction.user.id}`)
    .setLabel("Aprovar")
    .setStyle(ButtonStyle.Success);

  const reject = new ButtonBuilder()
    .setCustomId(`wl_reject:${interaction.user.id}`)
    .setLabel("Reprovar")
    .setStyle(ButtonStyle.Danger);

  await staffChannel.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(approve, reject)]
  });

  // aviso ao jogador e move para canal de espera
  const espera = interaction.guild.channels.cache.get(CONFIG.CHANNELS.ESPERA_RP);
  if (espera) {
    await espera.send(`📩 ${interaction.user} sua whitelist foi enviada. Aguarde análise da staff.`);
  }
  return interaction.reply({ ephemeral: true, content: "Whitelist enviada com sucesso! Aguarde a análise." });
}

export async function handleWhitelistReview(interaction) {
  const [action, userId] = interaction.customId.split(":");
  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  if (!member) {
    return interaction.reply({ ephemeral: true, content: "Usuário não encontrado no servidor." });
  }

  if (action === "wl_approve") {
    const role = interaction.guild.roles.cache.find(r => r.name === CONFIG.ROLES.RP);
    if (!role) return interaction.reply({ ephemeral: true, content: "Cargo RP não encontrado." });

    await member.roles.add(role).catch(()=>{});
    await interaction.reply({ content: `✅ Aprovado: ${member}. Cargo **${CONFIG.ROLES.RP}** atribuído.` });
    try { await member.send("✅ Você foi aprovado na whitelist RP do Black. Bom jogo!"); } catch {}
  } else if (action === "wl_reject") {
    const reprovados = interaction.guild.channels.cache.get(CONFIG.CHANNELS.REPROVADOS_RP);
    await interaction.reply({ ephemeral: true, content: "Envie o motivo da reprovação na mensagem que será criada." });

    const msg = await interaction.channel.send(`❌ **Reprovado:** <@${userId}> — por ${interaction.user}. Responda este tópico com o motivo.`);
    if (reprovados) await reprovados.send(`❌ <@${userId}> sua whitelist foi reprovada. Tente novamente futuramente.`);
    try { await member.send("❌ Sua whitelist RP no Black foi reprovada. Você pode tentar novamente no futuro."); } catch {}
  }
}
