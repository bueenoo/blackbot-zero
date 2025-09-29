import { CONFIG } from "../config.js";
import { loadConfig } from "./store.js";
import { resolveChannel } from "./resolve.js";

export function getConfiguredChannel(guild, keyId, keyName) {
  const persisted = loadConfig();
  const persistedId = persisted[keyId];
  if (persistedId) {
    const byId = guild.channels.cache.get(persistedId);
    if (byId) return byId;
  }
  const fallbackId = CONFIG.CHANNELS[keyId.replace(/_NAME$/,'')] || null;
  if (fallbackId) {
    const byCfg = guild.channels.cache.get(fallbackId);
    if (byCfg) return byCfg;
  }
  const byName = CONFIG.CHANNEL_NAMES[keyName];
  if (byName) return resolveChannel(guild, byName);
  return null;
}
