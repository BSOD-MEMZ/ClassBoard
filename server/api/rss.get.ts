export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const feedUrl =
    typeof query.url === "string" && query.url.trim()
      ? query.url.trim()
      : "https://www.chinanews.com.cn/rss/china.xml";

  try {
    const xmlText = await $fetch<string>(feedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });

    const items = parseRssItems(xmlText);
    const title = extractTag(xmlText, "title") || "RSS 资讯";

    return {
      title,
      updatedAt: new Date().toLocaleString("zh-CN"),
      items: items.slice(0, 8),
    };
  } catch {
    throw createError({ statusCode: 502, statusMessage: "RSS source unavailable" });
  }
});

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(re);
  if (match && match[1]) {
    return match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();
  }
  return "";
}

function parseRssItems(xml: string): { title: string; summary: string; time: string }[] {
  const itemBlocks = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  return itemBlocks.map((block) => {
    const title = extractTag(block, "title");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
    const link = extractTag(block, "link");

    let summary = description;
    // Truncate summary
    if (summary.length > 200) {
      summary = summary.slice(0, 200) + "…";
    }

    let time = "";
    if (pubDate) {
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          time = d.toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch {
        time = pubDate;
      }
    }

    return { title, summary, time };
  }).filter((item) => item.title);
}
