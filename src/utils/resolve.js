function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/^[^a-z0-9#]+/g, "")
    .replace(/[\s_·•・.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
export function resolveChannel(guild, wanted) {
  if (!guild || !wanted) return null;
  if (/^\d{16,20}$/.test(wanted)) return guild.channels.cache.get(wanted) || null;
  const direct = guild.channels.cache.find(ch => ch.name === wanted);
  if (direct) return direct;
  const target = normalizeName(wanted);
  return guild.channels.cache.find(ch => normalizeName(ch.name) === target) || null;
}
