import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface User {
  cardId: string;
  name: string;
  role: string;
  avatar: string;
}

let usersCache: User[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30s cache, so editing the JSON takes effect quickly

async function loadUsers(): Promise<User[]> {
  if (usersCache && Date.now() - cacheTime < CACHE_TTL) return usersCache;

  let raw: string | null = null;

  // Try Nitro serverAssets (works in production)
  try {
    const storage = useStorage("assets:server-data");
    raw = await storage.getItem<string>("users.json");
  } catch {
    // serverAssets not available (dev mode)
  }

  // Fallback: direct file read via process.cwd() (works in dev)
  if (!raw) {
    const usersPath = join(process.cwd(), "server", "data", "users.json");
    raw = await readFile(usersPath, "utf-8");
  }

  const data = JSON.parse(raw);
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
