// Server-side sanitization for user-submitted text (comments, testimonials).
// The goal is to neutralize links/URLs so that, if a visitor pastes one, it is
// broken into plain text instead of remaining a usable/clickable link.

// Matches: scheme URLs (http/https/ftp), www.* hosts, and bare domains with a
// known TLD (optionally followed by a path). Kept intentionally broad.
const URL_RE =
  /\b(?:(?:https?|ftp):\/\/|www\.)[^\s<>()]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:com|net|org|br|io|co|me|app|info|biz|gov|edu|tv|xyz|online|site|store|shop|link|live|dev|gg|to|cc|ly|be)\b(?:\/[^\s<>()]*)?/gi;

// Break a single matched URL into harmless plain text: drop the scheme/"www.",
// and replace the dots and slashes that make it a link with spaces.
function breakLink(match: string): string {
  return match
    .replace(/^(?:https?|ftp):\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/[./\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripLinks(input: string): string {
  if (!input) return '';
  // Also drop angle brackets to prevent any raw HTML/anchor injection.
  const noAngles = String(input).replace(/[<>]/g, '');
  return noAngles.replace(URL_RE, breakLink);
}

// True when the original text contained at least one link (useful for logging
// or future heuristics).
export function containsLink(input: string): boolean {
  if (!input) return false;
  URL_RE.lastIndex = 0;
  return URL_RE.test(String(input));
}
