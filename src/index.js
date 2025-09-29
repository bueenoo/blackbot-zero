import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Routes, REST, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "./config.js";
import { openTicket } from "./handlers/tickets.js";
import { sendVerificationPanel } from "./handlers/verification.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", async () => {
  console.log(`[BLACKBOT] ✅ Bot online como ${client.user.tag}`);

  // Registra /ticket no GUILD para evitar permissões globais
  try {
    const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);
    const commands = [
      new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Abrir um ticket privado")
        .addStringOption(o =>
          o.setName("tipo")
            .setDescription("Selecione o tipo do ticket")
            .setRequired(true)
            .addChoices(
              { name: "Doações", value: "doacoes" },
              { name: "Denúncia", value: "denuncia" },
              { name: "Suporte Técnico", value: "suporte" }
            )
        )
        .toJSON()
    ];

    await rest.put(
      Routes.applicationGuildCommands(client.user.id, CONFIG.GUILD_ID),
      { body: commands }
    );
    console.log("[BLACKBOT] Slash commands registrados no GUILD.");
  } catch (e) {
    console.error("[BLACKBOT:ERR] Falha ao registrar comandos:", e);
  }

  // (Opcional) envia painel de verificação com botões
  await sendVerificationPanel(client);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket") {
        const tipo = interaction.options.getString("tipo");
        await openTicket(interaction, tipo);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith("open_ticket_")) {
        const tipo = interaction.customId.replace("open_ticket_", "");
        await openTicket(interaction, tipo);
      }
    }
  } catch (err) {
    console.error("[INTERACTION ERROR]", err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "❌ Ocorreu um erro ao processar sua interação.", ephemeral: true });
    }
  }
});

client.login(CONFIG.TOKEN);
