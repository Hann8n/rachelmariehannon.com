function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function proxiedImageUrl(url) {
  if (!url) return "";
  return `/api/feed-image?u=${encodeURIComponent(url)}`;
}

function calculateReadTime(content) {
  if (!content) return "";
  const text = stripHtml(content);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);
  return readTime > 0 ? `${readTime} min read` : "";
}

function formatRelativeDate(pubDateText) {
  if (!pubDateText) return "";
  try {
    const pubDate = new Date(pubDateText);
    if (Number.isNaN(pubDate.getTime())) return "";
    const now = new Date();
    const diffMs = now - pubDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    if (diffDays < 7) return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    return pubDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return "";
  }
}

export function normalizeFeedItem(item) {
  if (!item || typeof item !== "object") return null;
  return {
    title: typeof item.title === "string" ? item.title : "",
    link: typeof item.link === "string" ? item.link : "",
    pubDate: typeof item.pubDate === "string" ? item.pubDate : "",
    description: typeof item.description === "string" ? item.description : "",
    content: typeof item.content === "string" ? item.content : "",
    id: typeof item.id === "string" ? item.id : "",
    author: typeof item.author === "string" ? item.author : "",
    categories: Array.isArray(item.categories)
      ? item.categories.filter((cat) => typeof cat === "string")
      : [],
    image: typeof item.image === "string" ? item.image : "",
  };
}

export function renderFeedItemCard(item) {
  const normalized = normalizeFeedItem(item);
  if (!normalized) return "";

  const link = normalized.link || "#";
  const title = normalized.title || "Post";
  const cleanDescription = stripHtml(normalized.description).trim();
  const imageUrl = normalized.image || "";
  const imageSrc = proxiedImageUrl(imageUrl);
  const readTime = calculateReadTime(normalized.content || normalized.description);
  const categories = normalized.categories || [];
  const date = formatRelativeDate(normalized.pubDate);

  let imageHtml = "";
  const shouldShowImage = Boolean(imageUrl);
  if (shouldShowImage) {
    imageHtml =
      `<div class="substack-feed-card-image">` +
      `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">` +
      `</div>`;
  }

  const metaInfo = [];
  if (date) metaInfo.push(date);
  if (readTime) metaInfo.push(readTime);
  const metaText = metaInfo.join(" • ");

  let tagsHtml = "";
  if (categories.length > 0) {
    const tags = categories
      .slice(0, 3)
      .map((cat) => `<span class="substack-feed-card-tag">${escapeHtml(cat)}</span>`)
      .join("");
    tagsHtml = `<div class="substack-feed-card-tags">${tags}</div>`;
  }

  const cardClasses = `substack-feed-card ui-surface${shouldShowImage ? " substack-feed-card--with-image" : ""}`;
  return (
    `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="${cardClasses}">` +
    `<div class="substack-feed-card-content">` +
    `<h3 class="substack-feed-card-title"><span class="substack-feed-text-bg">${escapeHtml(title)}</span></h3>` +
    (metaText
      ? `<span class="substack-feed-card-meta"><span class="substack-feed-text-bg">${escapeHtml(metaText)}</span></span>`
      : "") +
    (cleanDescription
      ? `<p class="substack-feed-card-description"><span class="substack-feed-text-bg">${escapeHtml(cleanDescription.substring(0, 120))}${cleanDescription.length > 120 ? "…" : ""}</span></p>`
      : "") +
    tagsHtml +
    `</div>` +
    imageHtml +
    `</a>`
  );
}

export function renderFeedCollection(items, displayedCount) {
  const safeItems = Array.isArray(items) ? items.map(normalizeFeedItem).filter(Boolean) : [];
  const count = Math.max(0, Math.min(displayedCount, safeItems.length));
  const cards = safeItems.slice(0, count).map(renderFeedItemCard).join("");
  const showMore = safeItems.length > count;
  const loadMoreRow = `<div class="substack-feed-load-more-row"><button class="button secondary-button substack-load-more" type="button"${showMore ? "" : ' style="display:none"'}>Show more articles</button></div>`;

  return {
    html: `<div class="substack-feed-cards ui-stack">${cards}${loadMoreRow}</div>`,
    total: safeItems.length,
    shown: count,
  };
}
