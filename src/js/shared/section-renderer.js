import { renderFeedCollection } from "./feed-render.js";

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHtml(text) {
  if (!text) return "";
  return String(text).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function formatParagraphs(text, firstParagraphClass = "") {
  if (!text || typeof text !== "string") return "";
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return paragraphs
    .map((paragraph, idx) => {
      const formatted = escapeHtml(paragraph).replace(/\n/g, "<br>");
      if (idx === 0 && firstParagraphClass) {
        return `<p class="${firstParagraphClass}">${formatted}</p>`;
      }
      return `<p>${formatted}</p>`;
    })
    .join("");
}

function parseReviewQuoteContent(content) {
  if (!content || typeof content !== "string") {
    return { quoteText: "", attributionText: "" };
  }
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return { quoteText: "", attributionText: "" };
  const parts = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const quoteRaw = parts[0] || normalized;
  const attributionRaw = parts.slice(1).join(" ").trim();
  return {
    quoteText: quoteRaw.replace(/^["']+|["']+$/g, "").trim(),
    attributionText: attributionRaw.replace(/^[—–-]\s*/, "").trim(),
  };
}

function parseEventDate(dateText) {
  if (!dateText || typeof dateText !== "string") return null;
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function applyLegacyTime(baseDate, timeText) {
  if (!baseDate || !timeText || typeof timeText !== "string") return baseDate;
  const copy = new Date(baseDate.getTime());
  const trimmed = timeText.trim();
  const twelveHour = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2] || "0");
    const meridiem = twelveHour[3].toUpperCase();
    if (hour === 12) hour = 0;
    if (meridiem === "PM") hour += 12;
    copy.setHours(hour, minute, 0, 0);
    return copy;
  }
  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      copy.setHours(hour, minute, 0, 0);
    }
  }
  return copy;
}

function parseEventStart(eventEntry) {
  const startsAt = eventEntry && typeof eventEntry.starts_at === "string" ? eventEntry.starts_at.trim() : "";
  if (startsAt) {
    const parsedStart = new Date(startsAt);
    if (!Number.isNaN(parsedStart.getTime())) {
      return parsedStart;
    }
  }
  const legacyDate = parseEventDate(eventEntry && eventEntry.date);
  if (!legacyDate) return null;
  return applyLegacyTime(legacyDate, eventEntry.time);
}

function hasRenderableEventContent(eventEntry) {
  if (!eventEntry || typeof eventEntry !== "object") return false;
  const textFields = [
    eventEntry.venue,
    eventEntry.city,
    eventEntry.details,
    eventEntry.time,
    eventEntry.link,
    eventEntry.google_maps_url,
  ];
  return textFields.some((value) => typeof value === "string" && value.trim());
}

function formatEventMonthKey(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatEventTime(date) {
  if (!date) return "";
  const midnight = date.getHours() === 0 && date.getMinutes() === 0;
  if (midnight) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatEventBadge(date) {
  if (!date) return null;
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
}

function normalizeUrl(urlText) {
  if (!urlText || typeof urlText !== "string") return "";
  try {
    return new URL(urlText).href;
  } catch (_) {
    return "";
  }
}

function buildDirectionsUrl(eventEntry) {
  const explicitMapUrl = normalizeUrl(eventEntry.google_maps_url);
  if (explicitMapUrl) return explicitMapUrl;
  const query = [eventEntry.venue, eventEntry.city].filter(Boolean).join(", ");
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildMapEmbedUrl(eventEntry) {
  const query = [eventEntry.venue, eventEntry.city].filter(Boolean).join(", ");
  if (!query) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function renderEventCard(eventEntry, idx, monthKey) {
  const eventTimeLabel = formatEventTime(eventEntry._parsedStart) || eventEntry.time;
  const eventBadge = formatEventBadge(eventEntry._parsedStart);
  const directionsUrl = buildDirectionsUrl(eventEntry);
  const mapEmbedUrl = buildMapEmbedUrl(eventEntry);
  const eventLink = normalizeUrl(eventEntry.link);
  const hasDetails = Boolean(eventEntry.details);
  const hasEventLink = Boolean(eventLink);
  const hasDirections = Boolean(directionsUrl);
  const eventMetaParts = [];
  if (eventEntry.city) eventMetaParts.push(eventEntry.city);
  if (eventTimeLabel) eventMetaParts.push(eventTimeLabel);
  const eventMeta = eventMetaParts
    .map((part, partIdx) => {
      const safePart = escapeHtml(part);
      if (partIdx === eventMetaParts.length - 1) return `<span class="event-meta-item">${safePart}</span>`;
      return `<span class="event-meta-item">${safePart}</span><span class="event-meta-separator" aria-hidden="true">•</span>`;
    })
    .join("");

  const parts = [];
  const monthAttr = monthKey ? ` data-event-month="${escapeHtml(monthKey)}"` : "";
  parts.push(
    `<article class="event-card ui-surface"${monthAttr} data-google-maps-url="${escapeHtml(eventEntry.google_maps_url || "")}" data-venue="${escapeHtml(eventEntry.venue || "")}" data-city="${escapeHtml(eventEntry.city || "")}" data-event-label="${escapeHtml(eventEntry.venue || "Event")}" data-event-index="${idx}">`
  );
  parts.push('<div class="event-card-layout">');
  parts.push('<div class="event-card-main">');
  parts.push('<div class="event-card-heading">');

  if (eventBadge) {
    parts.push(
      '<div class="event-date-badge" aria-hidden="true">' +
      `<span class="event-date-badge-month">${escapeHtml(eventBadge.month)}</span>` +
      `<span class="event-date-badge-day">${escapeHtml(eventBadge.day)}</span>` +
      "</div>"
    );
  }

  parts.push('<div class="event-heading-content">');
  parts.push('<div class="event-heading-copy">');
  if (eventEntry.venue) parts.push(`<h3 class="event-venue">${escapeHtml(eventEntry.venue)}</h3>`);
  if (eventMeta) parts.push(`<p class="event-meta">${eventMeta}</p>`);
  parts.push("</div>");
  if (hasDetails) parts.push(`<p class="event-details">${escapeHtml(eventEntry.details)}</p>`);

  if (hasEventLink || hasDirections) {
    parts.push('<div class="event-actions">');
    if (hasEventLink) {
      parts.push(
        `<a href="${escapeHtml(eventLink)}" target="_blank" rel="noopener noreferrer" class="event-link">View details</a>`
      );
    }
    if (hasDirections) {
      parts.push(
        `<button type="button" class="event-link event-directions" data-directions-url="${escapeHtml(directionsUrl)}">Get directions</button>`
      );
    }
    parts.push("</div>");
  }

  parts.push("</div>");
  parts.push("</div>");
  parts.push("</div>");

  if (mapEmbedUrl) {
    const mapTitle = `Map for ${eventEntry.venue || "event location"}`;
    parts.push('<div class="event-card-media">');
    parts.push(
      '<figure class="event-photo" data-event-photo hidden>' +
      '<img data-event-photo-img loading="lazy" alt="Venue photo" />' +
      "</figure>"
    );
    parts.push(
      `<iframe class="event-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeHtml(mapEmbedUrl)}" title="${escapeHtml(mapTitle)}"></iframe>`
    );
    parts.push("</div>");
  }

  parts.push("</div>");
  parts.push("</article>");
  return parts.join("");
}

export function renderSectionsHtml(siteData, { feedItems = [], skeletonHtml = "" } = {}) {
  const sections = Array.isArray(siteData?.sections) ? siteData.sections : [];

  return sections
    .map((section) => {
      const type = section?.type;
      const idAttr = section?.id ? ` id="${escapeHtml(section.id)}"` : "";
      const classAttr = `section section-${escapeHtml(type || "unknown")}`;

      let content = "";
      if (type === "text") {
        if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
        if (section.tagline) content += `<p class="section-tagline">${escapeHtml(section.tagline)}</p>`;
        if (section.content) content += formatParagraphs(section.content, "lede");
      } else if (type === "quote") {
        if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
        if (section.quote) {
          content += "<blockquote>";
          content += `<span>"${escapeHtml(section.quote)}"</span>`;
          if (section.attribution) {
            content += `<span class="quote-attribution">– ${escapeHtml(section.attribution)}</span>`;
          }
          content += "</blockquote>";
        }
      } else if (type === "list") {
        if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
        if (section.tagline) content += `<p class="section-tagline">${escapeHtml(section.tagline)}</p>`;
        if (Array.isArray(section.items)) {
          content += "<ul>";
          for (const item of section.items) {
            content += "<li>";
            if (item?.title) content += `<strong>${escapeHtml(item.title)}</strong> `;
            if (item?.description) content += escapeHtml(item.description);
            content += "</li>";
          }
          content += "</ul>";
        }
      } else if (type === "two-column") {
        if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
        content += `<div class="about-grid">`;
        if (section.left_column) {
          content += `<div class="about-block">`;
          if (section.left_column.title) content += `<h3>${escapeHtml(section.left_column.title)}</h3>`;
          if (Array.isArray(section.left_column.items)) {
            content += "<ul>";
            for (const item of section.left_column.items) {
              content += "<li>";
              if (item?.title) content += `<strong>${escapeHtml(item.title)}</strong> `;
              if (item?.description) content += escapeHtml(item.description);
              content += "</li>";
            }
            content += "</ul>";
          }
          content += "</div>";
        }
        if (section.right_column) {
          content += `<div class="about-block">`;
          if (section.right_column.title) content += `<h3>${escapeHtml(section.right_column.title)}</h3>`;
          const isReviewBlock = (section.right_column.title || "").trim().toLowerCase() === "review";
          if (isReviewBlock) {
            const { quoteText, attributionText } = parseReviewQuoteContent(section.right_column.content || "");
            if (quoteText) {
              content += "<blockquote>";
              content += `<p>${escapeHtml(quoteText)}</p>`;
              if (attributionText) content += `<cite class="quote-attribution">– ${escapeHtml(attributionText)}</cite>`;
              content += "</blockquote>";
            }
          } else if (section.right_column.content) {
            content += `<div>${escapeHtml(section.right_column.content).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</div>`;
          }
          content += "</div>";
        }
        content += `</div>`;
      } else if (type === "substack") {
        if (section.title || section.tagline) {
          const substackUrl = section.button_url || "https://substack.com/@imightbeanidiot";
          content += `<div class="section-header"><div class="section-header-top">`;
          if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
          content += `<a href="${escapeHtml(substackUrl)}" target="_blank" rel="noopener noreferrer" class="substack-header-link" aria-label="Visit Substack">`;
          content += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M15 3.604H1v1.891h14v-1.89ZM1 7.208V16l7-3.926L15 16V7.208zM15 0H1v1.89h14z"/></svg>';
          content += '<span class="substack-header-link-text">Open on Substack</span></a>';
          content += `</div>`;
          if (section.tagline) content += `<p class="section-tagline">${escapeHtml(section.tagline)}</p>`;
          content += `</div>`;
        }
        if (Array.isArray(feedItems) && feedItems.length > 0) {
          const { html } = renderFeedCollection(feedItems, 4);
          content += `<div class="substack-feed-shell"><div class="substack-feed-list" data-substack-feed>${html}</div></div>`;
        } else {
          content += `<div class="substack-feed-shell"><div class="substack-feed-list" data-substack-feed>${skeletonHtml}</div></div>`;
        }
      } else if (type === "events") {
        const entries = Array.isArray(section.items)
          ? section.items
          : (Array.isArray(section.events) ? section.events : []);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = entries
          .map((entry, idx) => {
            const parsedStart = parseEventStart(entry);
            return { ...entry, _parsedStart: parsedStart, _idx: idx };
          })
          .filter((entry) => entry._parsedStart && entry._parsedStart >= today && hasRenderableEventContent(entry))
          .sort((a, b) => a._parsedStart - b._parsedStart || a._idx - b._idx);

        if (!upcomingEvents.length) {
          if (section.title || section.tagline) {
            content += `<div class="section-header">`;
            if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
            if (section.tagline) content += `<p class="section-tagline">${escapeHtml(section.tagline)}</p>`;
            content += `</div>`;
          }
          content += `<p class="events-empty">${escapeHtml(section.empty_state_text || "No upcoming events right now. Please check back soon.")}</p>`;
          if (!content) return "";
          return `<section${idAttr} class="${classAttr}">${content}</section>`;
        }

        if (section.title || section.tagline) {
          content += `<div class="section-header">`;
          if (section.title) content += `<h2>${sanitizeHtml(section.title)}</h2>`;
          if (section.tagline) content += `<p class="section-tagline">${escapeHtml(section.tagline)}</p>`;
          content += `</div>`;
        }

        const monthGroups = new Map();
        upcomingEvents.forEach((eventEntry) => {
          const monthKey = formatEventMonthKey(eventEntry._parsedStart);
          if (!monthGroups.has(monthKey)) {
            monthGroups.set(monthKey, []);
          }
          monthGroups.get(monthKey).push(eventEntry);
        });
        const monthKeys = Array.from(monthGroups.keys());
        const currentMonthKey = formatEventMonthKey(today);
        const initialMonthKey = monthGroups.has(currentMonthKey) ? currentMonthKey : monthKeys[0];
        const initialMonthIndex = monthKeys.indexOf(initialMonthKey);
        const remainingMonthKeys = monthKeys.slice(initialMonthIndex + 1);

        content += `<div data-events-month-loader><div class="events-list ui-stack">`;
        const initialMonthEvents = monthGroups.get(initialMonthKey) || [];
        initialMonthEvents.forEach((eventEntry, idx) => {
          content += renderEventCard(eventEntry, idx, initialMonthKey);
        });
        let renderedEventIndex = initialMonthEvents.length;
        remainingMonthKeys.forEach((monthKey) => {
          const monthEvents = monthGroups.get(monthKey) || [];
          const monthHtml = monthEvents
            .map((eventEntry, idx) => renderEventCard(eventEntry, renderedEventIndex + idx, monthKey))
            .join("");
          renderedEventIndex += monthEvents.length;
          content += `<template data-events-month-template data-month-key="${escapeHtml(monthKey)}" data-event-count="${monthEvents.length}">${monthHtml}</template>`;
        });
        if (remainingMonthKeys.length > 0) {
          content += '<div class="events-load-more-row"><button class="button secondary-button substack-load-more" type="button" data-events-load-more>Show more events</button></div>';
        }
        content += "</div></div>";
      }

      if (!content) return "";
      return `<section${idAttr} class="${classAttr}">${content}</section>`;
    })
    .join("");
}
