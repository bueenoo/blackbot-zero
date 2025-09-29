import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("src/data");
const FILE = path.join(DATA_DIR, "config.json");

export function loadConfig() {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(obj) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}
