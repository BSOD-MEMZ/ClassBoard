import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

interface User {
  cardId: string;
  name: string;
  role: string;
  avatar: string;
}

let usersCache: User[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30s cache, so editing the JSON takes effect quickly

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function loadUsers(): Promise<User[]> {
  if (usersCache && Date.now() - cacheTime < CACHE_TTL) return usersCache;

  let data: { users?: User[] } | null = null;

  // Strategy 1: Nitro serverAssets storage (dev & production)
  try {
    if (typeof useStorage === "function") {
      const storage = useStorage("assets:server-data");
      const item = await storage.getItem("users.json");
      if (item) {
        // Nitro may auto-parse JSON, item can be string or object
        data = typeof item === "string" ? JSON.parse(item) : item;
      }
    }
  } catch { /* useStorage unavailable */ }

  // Strategy 2: process.cwd() based paths (fallback)
  if (!data) {
    const cwd = process.cwd();
    const raw = await tryReadFile(join(cwd, "server", "data", "users.json"))
             || await tryReadFile(join(cwd, "data", "users.json"))
             || await tryReadFile(join(cwd, ".output", "server", "data", "users.json"))
             || await tryReadFile(join(cwd, ".output", "public", "_nitro", "assets", "server-data", "users.json"))
             || await tryReadFile(join(cwd, "public", "_nitro", "assets", "server-data", "users.json"));
    if (raw) data = JSON.parse(raw);
  }

  // Strategy 3: import.meta.url relative (last resort)
  if (!data) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const raw = await tryReadFile(join(__dirname, "..", "data", "users.json"));
    if (raw) data = JSON.parse(raw);
  }

  if (!data) {
    throw createError({ statusCode: 500, statusMessage: "Users data not found" });
  }

  usersCache = (data.users || []) as User[];
  cacheTime = Date.now();
  return usersCache;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const cardId = typeof query.card === "string" ? query.card.trim() : "";

  if (!cardId || cardId.length < 10) {
    throw createError({ statusCode: 400, statusMessage: "Invalid card ID" });
  }

  const users = await loadUsers();
  const user = users.find((u) => u.cardId === cardId);

  if (!user) {
    return { ok: false, message: "未识别的卡号" };
  }

  return {
    ok: true,
    user: {
      name: user.name,
      role: user.role,
      avatar: user.avatar || "",
    },
  };
});
