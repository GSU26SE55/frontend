/**
 * Turns a raw User-Agent string into something a person can recognise — "Chrome 130" /
 * "Macintosh" instead of the 120-character original.
 *
 * Deliberately a few regexes rather than a UA-parsing dependency: the only job is helping
 * someone spot which row is their own laptop, so an "Unknown" on an exotic browser is a fine
 * outcome. Callers that need the exact string still have `full`.
 */
export function parseUserAgent(ua?: string | null) {
  if (!ua) return null;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Edg)[/\s]([\d.]+)/);
  const os = ua.match(/\(([^)]+)\)/);
  return {
    browser: browser
      ? `${browser[1].replace("Edg", "Edge")} ${browser[2].split(".")[0]}`
      : "Unknown",
    os: os ? os[1].split(";")[0].trim() : "Unknown",
    full: ua,
  };
}

/** "Chrome 130 on Macintosh", or the fallback when the UA was empty or unrecognised. */
export function describeUserAgent(
  ua?: string | null,
  fallback = "Unknown device",
) {
  const parsed = parseUserAgent(ua);
  if (!parsed) return fallback;
  if (parsed.browser === "Unknown" && parsed.os === "Unknown") return fallback;
  if (parsed.os === "Unknown") return parsed.browser;
  if (parsed.browser === "Unknown") return parsed.os;
  return `${parsed.browser} on ${parsed.os}`;
}
