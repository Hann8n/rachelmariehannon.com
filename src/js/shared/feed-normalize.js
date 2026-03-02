const NAMED_HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  hellip: "...",
  mdash: "—",
  ndash: "–",
};

function decodeHtmlEntities(text) {
  if (typeof text !== "string" || !text.includes("&")) return text || "";
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (full, entityBody) => {
    if (!entityBody) return full;
    if (entityBody[0] === "#") {
      const isHex = entityBody[1]?.toLowerCase() === "x";
      const numericPart = isHex ? entityBody.slice(2) : entityBody.slice(1);
      const codePoint = Number.parseInt(numericPart, isHex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return full;
      try {
        return String.fromCodePoint(codePoint);
      } catch (_) {
        return full;
      }
    }
    const named = NAMED_HTML_ENTITIES[entityBody.toLowerCase()];
    return typeof named === "string" ? named : full;
  });
}

export function normalizeFeedItem(item) {
  if (!item || typeof item !== "object") return null;
  return {
    title: decodeHtmlEntities(typeof item.title === "string" ? item.title : ""),
    link: typeof item.link === "string" ? item.link : "",
    pubDate: typeof item.pubDate === "string" ? item.pubDate : "",
    description: decodeHtmlEntities(typeof item.description === "string" ? item.description : ""),
    content: decodeHtmlEntities(typeof item.content === "string" ? item.content : ""),
    id: typeof item.id === "string" ? item.id : "",
    author: decodeHtmlEntities(typeof item.author === "string" ? item.author : ""),
    categories: Array.isArray(item.categories)
      ? item.categories
          .filter((cat) => typeof cat === "string")
          .map((cat) => decodeHtmlEntities(cat))
      : [],
    image: typeof item.image === "string" ? item.image : "",
  };
}
