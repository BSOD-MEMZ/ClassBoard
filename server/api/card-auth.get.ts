import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface User {
  cardId: string;
  name: string;
  role: string;
  avatar: string;
}

let usersCache: User[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30s cache, so editing the JSON takes effect quickly

function getUsersPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, "..", "data", "users.json");
}

async function loadUsers(): Promise<User[]> {
  if (usersCache && Date.now() - cacheTime < CACHE_TTL) return usersCache;
  const raw = await readFile(getUsersPath(), "utf-8");
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
