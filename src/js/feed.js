import { normalizeFeedItem, renderFeedCollection, renderFeedItemCard } from "./shared/feed-render.js";

const DEFAULT_SUBSTACK_URL = "https://imightbeanidiot.substack.com";
const NATIVE_FEED_API_URL = "/api/rss-json";
const INITIAL_COUNT = 4;
const BATCH_SIZE = 4;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

const loadingHtml = '<div class="substack-feed-loading" aria-busy="true" aria-label="Loading feed"></div>';
window.SUBSTACK_SKELETON_HTML = loadingHtml;

function applyFeedDataToElement(el, allItems) {
  const normalizedItems = Array.isArray(allItems) ? allItems.map(normalizeFeedItem).filter(Boolean) : [];
  if (!normalizedItems.length) {
    el.innerHTML = '<p class="substack-feed-error">No posts available.</p>';
    return;
  }

  const existingCards = el.querySelectorAll(".substack-feed-card").length;
  let displayedCount = existingCards || Math.min(INITIAL_COUNT, normalizedItems.length);

  if (!existingCards) {
    const { html } = renderFeedCollection(normalizedItems, displayedCount);
    el.innerHTML = html;
  }

  let loadMoreBtn = el.querySelector(".substack-load-more");
  let loadMoreRow = el.querySelector(".substack-feed-load-more-row");

  if (!loadMoreBtn || !loadMoreRow) {
    loadMoreRow = document.createElement("div");
    loadMoreRow.className = "substack-feed-load-more-row";
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.type = "button";
    loadMoreBtn.className = "button secondary-button substack-load-more";
    loadMoreRow.appendChild(loadMoreBtn);
    const cardsContainer = el.querySelector(".substack-feed-cards");
    if (cardsContainer) cardsContainer.appendChild(loadMoreRow);
  }

  const updateLoadMoreVisibility = () => {
    const remaining = normalizedItems.length - displayedCount;
    loadMoreBtn.style.display = remaining > 0 ? "" : "none";
    if (remaining > 0) loadMoreBtn.textContent = "Show more articles";
  };

  updateLoadMoreVisibility();

  if (loadMoreBtn.dataset.bound === "true") return;
  loadMoreBtn.dataset.bound = "true";
  loadMoreBtn.addEventListener("click", () => {
    const nextBatch = normalizedItems.slice(displayedCount, displayedCount + BATCH_SIZE);
    if (!nextBatch.length) {
      updateLoadMoreVisibility();
      return;
    }
    for (const item of nextBatch) {
      loadMoreRow.insertAdjacentHTML("beforebegin", renderFeedItemCard(item));
    }
    displayedCount += nextBatch.length;
    updateLoadMoreVisibility();
  });
}

async function fetchNativeFeedItems() {
  const response = await fetch(NATIVE_FEED_API_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.items) ? data.items : [];
}

async function loadSubstackFeeds() {
  const bootstrapItems = Array.isArray(window.__SUBSTACK_FEED_ITEMS__) ? window.__SUBSTACK_FEED_ITEMS__ : null;
  const elements = document.querySelectorAll("[data-substack-feed]");
  if (!elements.length) return;

  for (const el of elements) {
    try {
      if (bootstrapItems && bootstrapItems.length) {
        applyFeedDataToElement(el, bootstrapItems);
        continue;
      }
      if (!el.querySelector(".substack-feed-cards")) {
        el.innerHTML = loadingHtml;
      }
      const items = await fetchNativeFeedItems();
      applyFeedDataToElement(el, items);
    } catch (err) {
      console.error("Substack feed error:", err);
      el.innerHTML = `<p class="substack-feed-error">Unable to load feed. <a href="${escapeHtml(DEFAULT_SUBSTACK_URL)}" target="_blank" rel="noopener noreferrer">Visit Substack</a></p>`;
    }
  }
}

window.loadSubstackFeeds = loadSubstackFeeds;

function initFeeds() {
  loadSubstackFeeds();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFeeds);
} else {
  setTimeout(initFeeds, 100);
}
