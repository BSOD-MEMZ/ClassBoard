import type { FeedData } from "@/types";

export function normalizeFeedPayload(payload: Record<string, unknown> | null | undefined): FeedData {
  const source = payload && typeof payload === "object" ? payload : {};
  const title = typeof source.title === "string" && source.title.trim() ? source.title.trim() : "校园资讯";
  const updatedAt = typeof source.updatedAt === "string" ? source.updatedAt : "";
  const rawItems = Array.isArray(source.items) ? (source.items as Record<string, unknown>[]) : [];
  const items = rawItems
    .map((item) => ({
      title: String(item?.title || "").trim(),
      summary: String(item?.summary || "").trim(),
      time: String(item?.time || "").trim(),
    }))
    .filter((x) => x.title)
    .slice(0, 8);
  return { title, updatedAt, items };
}
