import { XMLParser } from "fast-xml-parser";
import { normalizeFeedItem } from "./src/js/shared/feed-render.js";
import { renderSectionsHtml } from "./src/js/shared/section-renderer.js";

const FIXED_RSS_FEED_URL = "https://imightbeanidiot.substack.com/feed";
const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
});

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function rssItemToNormalized(item) {
  const mediaContent = Array.isArray(item?.["media:content"])
    ? item["media:content"][0]
    : item?.["media:content"];
  const enclosure = Array.isArray(item?.enclosure) ? item.enclosure[0] : item?.enclosure;
  const guidValue = typeof item?.guid === "object" ? item.guid?.["#text"] : item?.guid;
  return normalizeFeedItem({
    title: firstString(item?.title),
    link: firstString(item?.link),
    pubDate: firstString(item?.pubDate, item?.published, item?.updated),
    description: firstString(item?.description, item?.summary),
    content: firstString(item?.["content:encoded"], item?.content),
    id: firstString(guidValue),
    author: firstString(item?.["dc:creator"], item?.author),
    categories: (Array.isArray(item?.category) ? item.category : item?.category ? [item.category] : [])
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean),
    image: firstString(mediaContent?.["@_url"], enclosure?.["@_url"], enclosure?.url),
  });
}

function atomItemToNormalized(entry) {
  const links = Array.isArray(entry?.link) ? entry.link : entry?.link ? [entry.link] : [];
  const primaryLink =
    links.find((link) => link?.["@_rel"] === "alternate" && typeof link?.["@_href"] === "string") ||
    links.find((link) => typeof link?.["@_href"] === "string");
  return normalizeFeedItem({
    title: firstString(entry?.title?.["#text"], entry?.title),
    link: firstString(primaryLink?.["@_href"]),
    pubDate: firstString(entry?.published, entry?.updated),
    description: firstString(entry?.summary?.["#text"], entry?.summary),
    content: firstString(entry?.content?.["#text"], entry?.content),
    id: firstString(entry?.id),
    author: firstString(entry?.author?.name?.["#text"], entry?.author?.name, entry?.author),
    categories: (Array.isArray(entry?.category) ? entry.category : entry?.category ? [entry.category] : [])
      .map((value) => firstString(value?.["@_term"], value?.term, value))
      .filter(Boolean),
    image: "",
  });
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("rss-fetch-timeout"), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "rachelmariehannon-feed-service/1.0",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getFeedPayload() {
  let rssResponse;
  try {
    rssResponse = await fetchWithTimeout(FIXED_RSS_FEED_URL, 10000);
  } catch (_) {
    throw new Error("Failed to fetch RSS feed");
  }

  if (!rssResponse.ok) {
    throw new Error(`Upstream RSS feed request failed (${rssResponse.status})`);
  }

  let xmlText;
  try {
    xmlText = await rssResponse.text();
  } catch (_) {
    throw new Error("Failed to read upstream RSS response");
  }

  let parsed;
  try {
    parsed = XML_PARSER.parse(xmlText);
  } catch (_) {
    throw new Error("Failed to parse RSS feed XML");
  }

  const channel = parsed?.rss?.channel;
  const rssItemsRaw = channel?.item;
  const feed = parsed?.feed;
  const atomEntriesRaw = feed?.entry;
  const rssItems = Array.isArray(rssItemsRaw) ? rssItemsRaw : rssItemsRaw ? [rssItemsRaw] : [];
  const atomEntries = Array.isArray(atomEntriesRaw)
    ? atomEntriesRaw
    : atomEntriesRaw
      ? [atomEntriesRaw]
      : [];

  const items = (rssItems.length
    ? rssItems.map(rssItemToNormalized)
    : atomEntries.map(atomItemToNormalized)).filter(Boolean);

  return {
    source: FIXED_RSS_FEED_URL,
    title: firstString(channel?.title, feed?.title?.["#text"], feed?.title),
    link: firstString(channel?.link, feed?.link?.["@_href"]),
    description: firstString(channel?.description, feed?.subtitle?.["#text"], feed?.subtitle),
    generator: firstString(channel?.generator, feed?.generator),
    lastBuildDate: firstString(channel?.lastBuildDate, feed?.updated),
    itemCount: items.length,
    items,
  };
}

function isHtmlNavigationRequest(request, url) {
  if (request.method !== "GET") return false;
  if (url.pathname.startsWith("/api/")) return false;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function injectSectionsIntoIndex(html, sectionsHtml, bootstrapScript) {
  const sectionsReplaced = html.replace(
    /<div id="sections-container" aria-live="polite">[\s\S]*?<\/div>/,
    `<div id="sections-container" aria-live="polite">${sectionsHtml}</div>`
  );
  return sectionsReplaced.replace("</body>", `${bootstrapScript}</body>`);
}

async function handleSsrPage(request, env) {
  const [shellResponse, siteResponse, feedPayloadResult] = await Promise.all([
    env.ASSETS.fetch(new Request(new URL("/index.html", request.url))),
    env.ASSETS.fetch(new Request(new URL("/content/site.json", request.url))),
    getFeedPayload().catch(() => null),
  ]);

  if (!shellResponse.ok || !siteResponse.ok) {
    return env.ASSETS.fetch(request);
  }

  const [shellHtml, siteData] = await Promise.all([shellResponse.text(), siteResponse.json()]);
  const feedItems = Array.isArray(feedPayloadResult?.items) ? feedPayloadResult.items : [];
  const sectionsHtml = renderSectionsHtml(siteData, { feedItems });
  const bootstrapScript = `<script>window.__SSR_RENDERED__=true;window.__SITE_DATA__=${JSON.stringify(siteData)};window.__SUBSTACK_FEED_ITEMS__=${JSON.stringify(feedItems)};</script>`;
  const finalHtml = injectSectionsIntoIndex(shellHtml, sectionsHtml, bootstrapScript);

  return new Response(finalHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}

async function handleRssJson(request) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await getFeedPayload();
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Feed request failed" }, 502);
  }

  return json(
    payload,
    200,
    {
      "cache-control": "public, max-age=300, s-maxage=300",
    }
  );
}

function isAllowedFeedImageUrl(imageUrl) {
  if (!imageUrl) return false;
  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== "https:") return false;
    return true;
  } catch (_) {
    return false;
  }
}

async function handleFeedImage(request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const source = url.searchParams.get("u") || "";
  if (!isAllowedFeedImageUrl(source)) {
    return new Response("Invalid image URL", { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch(source, {
      cf: { cacheEverything: true, cacheTtl: 86400 },
      headers: { "user-agent": "rachelmariehannon-feed-service/1.0" },
    });
  } catch (_) {
    return new Response("Image unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Image unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") || "image/jpeg",
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

function isValidId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{10,}$/.test(value);
}

function normalizeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return new URL(value).href;
  } catch (_) {
    return "";
  }
}

function extractPlaceIdFromMapsUrl(urlText) {
  const normalized = normalizeUrl(urlText);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    const fromQuery =
      parsed.searchParams.get("query_place_id") ||
      parsed.searchParams.get("place_id");
    if (isValidId(fromQuery || "")) return fromQuery;

    const qParam = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (qParam && qParam.startsWith("place_id:")) {
      const maybeId = qParam.replace(/^place_id:/, "");
      if (isValidId(maybeId)) return maybeId;
    }
  } catch (_) {}

  const decoded = decodeURIComponent(normalized);
  const chMatch = decoded.match(/ChI[0-9A-Za-z_-]{10,}/);
  if (chMatch && isValidId(chMatch[0])) return chMatch[0];

  const bangMatch = decoded.match(/!1s([A-Za-z0-9_-]{10,})/);
  if (bangMatch && isValidId(bangMatch[1])) return bangMatch[1];

  return "";
}

function extractQueryFromMapsUrl(urlText) {
  const normalized = normalizeUrl(urlText);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    const q = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (q && !q.startsWith("place_id:")) return q.trim();

    const placePath = parsed.pathname.match(/\/place\/([^/]+)/);
    if (placePath && placePath[1]) {
      return decodeURIComponent(placePath[1]).replace(/\+/g, " ").trim();
    }
  } catch (_) {}

  return "";
}

async function resolvePlaceId(apiKey, { placeId, mapsUrl, query }) {
  if (isValidId(placeId)) return placeId;

  const fromUrl = extractPlaceIdFromMapsUrl(mapsUrl);
  if (fromUrl) return fromUrl;

  const searchQuery = query || extractQueryFromMapsUrl(mapsUrl);
  if (!searchQuery) return "";

  const findUrl =
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=" +
    encodeURIComponent(searchQuery) +
    "&inputtype=textquery&fields=place_id&key=" +
    encodeURIComponent(apiKey);

  const findResp = await fetch(findUrl);
  if (!findResp.ok) return "";
  const findData = await findResp.json();
  const candidateId = findData?.candidates?.[0]?.place_id || "";
  return isValidId(candidateId) ? candidateId : "";
}

async function handlePlaceDetails(request, env) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return json({ error: "Missing GOOGLE_MAPS_API_KEY secret" }, 500);
  }

  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId") || "";
  const mapsUrl = url.searchParams.get("mapsUrl") || "";
  const query = url.searchParams.get("query") || "";

  const resolvedPlaceId = await resolvePlaceId(apiKey, { placeId, mapsUrl, query });
  if (!resolvedPlaceId) {
    return json({ error: "Could not resolve placeId" }, 400);
  }

  const detailsUrl =
    "https://maps.googleapis.com/maps/api/place/details/json?place_id=" +
    encodeURIComponent(resolvedPlaceId) +
    "&fields=name,url,photos&key=" +
    encodeURIComponent(apiKey);

  const detailsResp = await fetch(detailsUrl);
  if (!detailsResp.ok) {
    return json({ error: "Upstream place details request failed" }, 502);
  }

  const details = await detailsResp.json();
  if (details.status !== "OK" || !details.result) {
    return json(
      { error: "Place not found", status: details.status || "UNKNOWN" },
      404
    );
  }

  const photoRef = details.result.photos?.[0]?.photo_reference || "";
  const photoUrl = photoRef
    ? "/api/place-photo?photoRef=" + encodeURIComponent(photoRef)
    : "";

  return json(
    {
      resolvedPlaceId,
      name: details.result.name || "",
      url: details.result.url || "",
      photoUrl,
    },
    200,
    { "cache-control": "public, max-age=300, s-maxage=300" }
  );
}

async function handlePlacePhoto(request, env) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new Response("Missing GOOGLE_MAPS_API_KEY secret", { status: 500 });
  }

  const url = new URL(request.url);
  const photoRef = url.searchParams.get("photoRef") || "";
  if (typeof photoRef !== "string" || photoRef.trim().length < 10) {
    return new Response("Invalid photoRef", { status: 400 });
  }

  const photoUrl =
    "https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=" +
    encodeURIComponent(photoRef) +
    "&key=" +
    encodeURIComponent(apiKey);

  const photoResp = await fetch(photoUrl);
  if (!photoResp.ok || !photoResp.body) {
    return new Response("Photo unavailable", { status: 502 });
  }

  return new Response(photoResp.body, {
    status: 200,
    headers: {
      "content-type": photoResp.headers.get("content-type") || "image/jpeg",
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isHtmlNavigationRequest(request, url) && (url.pathname === "/" || url.pathname === "/index.html")) {
      return handleSsrPage(request, env);
    }

    if (url.pathname === "/api/rss-json") {
      return handleRssJson(request);
    }
    if (url.pathname === "/api/feed-image") {
      return handleFeedImage(request);
    }

    if (url.pathname === "/api/place-details") {
      return handlePlaceDetails(request, env);
    }

    if (url.pathname === "/api/place-photo") {
      return handlePlacePhoto(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
