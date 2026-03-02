import { XMLParser } from "fast-xml-parser";

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

function normalizeItem(item) {
  const mediaContent = Array.isArray(item?.["media:content"])
    ? item["media:content"][0]
    : item?.["media:content"];
  const enclosure = Array.isArray(item?.enclosure) ? item.enclosure[0] : item?.enclosure;
  const guidValue = typeof item?.guid === "object" ? item.guid?.["#text"] : item?.guid;

  return {
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
  };
}

function normalizeAtomEntry(entry) {
  const links = Array.isArray(entry?.link) ? entry.link : entry?.link ? [entry.link] : [];
  const primaryLink =
    links.find((link) => link?.["@_rel"] === "alternate" && typeof link?.["@_href"] === "string") ||
    links.find((link) => typeof link?.["@_href"] === "string");

  return {
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
  };
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("rss-fetch-timeout"), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "rachelmariehannon-rss2json/1.0",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleRssJson(request) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  let rssResponse;
  try {
    rssResponse = await fetchWithTimeout(FIXED_RSS_FEED_URL, 10000);
  } catch (_) {
    return json({ error: "Failed to fetch RSS feed" }, 502);
  }

  if (!rssResponse.ok) {
    return json(
      { error: "Upstream RSS feed request failed", status: rssResponse.status },
      502
    );
  }

  let xmlText;
  try {
    xmlText = await rssResponse.text();
  } catch (_) {
    return json({ error: "Failed to read upstream RSS response" }, 502);
  }

  let parsed;
  try {
    parsed = XML_PARSER.parse(xmlText);
  } catch (_) {
    return json({ error: "Failed to parse RSS feed XML" }, 502);
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

  const items = rssItems.length
    ? rssItems.map(normalizeItem)
    : atomEntries.map(normalizeAtomEntry);

  return json(
    {
      source: FIXED_RSS_FEED_URL,
      title: firstString(channel?.title, feed?.title?.["#text"], feed?.title),
      link: firstString(channel?.link, feed?.link?.["@_href"]),
      description: firstString(channel?.description, feed?.subtitle?.["#text"], feed?.subtitle),
      generator: firstString(channel?.generator, feed?.generator),
      lastBuildDate: firstString(channel?.lastBuildDate, feed?.updated),
      itemCount: items.length,
      items,
    },
    200,
    {
      "cache-control": "public, max-age=60, s-maxage=120",
    }
  );
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

    if (url.pathname === "/api/rss-json") {
      return handleRssJson(request);
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
