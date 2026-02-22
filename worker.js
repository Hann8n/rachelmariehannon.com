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

function isValidId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{10,}$/.test(value);
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
  if (!isValidId(placeId)) {
    return json({ error: "Invalid placeId" }, 400);
  }

  const detailsUrl =
    "https://maps.googleapis.com/maps/api/place/details/json?place_id=" +
    encodeURIComponent(placeId) +
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
  if (!isValidId(photoRef)) {
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

    if (url.pathname === "/api/place-details") {
      return handlePlaceDetails(request, env);
    }

    if (url.pathname === "/api/place-photo") {
      return handlePlacePhoto(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
