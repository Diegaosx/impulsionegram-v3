// RapidAPI social-media profile lookup. The key/host are configured in the
// admin Integrations tab (x-rapidapi-key / x-rapidapi-host). Used by the home
// checkout modal to preview the target Instagram profile the client typed
// (photo + follower/following/post counts) before paying.

export function isRapidApiConfigured(key?: string): boolean {
  return !!(key && key.trim());
}

// Instagram/Facebook serve profile pictures from these CDNs and block
// cross-origin hotlinking (Cross-Origin-Resource-Policy), so the browser can't
// render them directly. We proxy them through our own origin — this allowlist
// keeps that proxy from being turned into an open SSRF relay.
export function isProxyableImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return /(^|\.)cdninstagram\.com$/.test(host) ||
           /(^|\.)fbcdn\.net$/.test(host) ||
           /(^|\.)cdninstagram\.net$/.test(host);
  } catch {
    return false;
  }
}

export interface RapidProfile {
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  following: number;
  posts: number;
  isPrivate: boolean;
  isVerified: boolean;
}

// Pull a numeric count out of a value that different API shapes express in
// different ways: a plain number, a numeric string, or `{ count: n }`.
function toCount(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseInt(v.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && v.count != null) return toCount(v.count);
  return 0;
}

// social-api4 returns the profile under `data` (sometimes `data.user`). Be
// defensive about the exact field names so a small API change doesn't break
// the whole lookup.
function normalizeProfile(payload: any): RapidProfile | null {
  const root = payload?.data ?? payload;
  if (!root || typeof root !== 'object') return null;
  const u = root.user ?? root;
  const username = String(u.username || u.username_or_id_or_url || '').trim();
  if (!username) return null;
  return {
    username,
    fullName: String(u.full_name || u.fullName || u.name || ''),
    profilePicUrl: String(u.profile_pic_url_hd || u.profile_pic_url || u.profilePicUrl || u.hd_profile_pic_url_info?.url || ''),
    followers: toCount(u.follower_count ?? u.followers ?? u.edge_followed_by ?? u.followers_count),
    following: toCount(u.following_count ?? u.following ?? u.edge_follow ?? u.followings_count),
    posts: toCount(u.media_count ?? u.posts ?? u.edge_owner_to_timeline_media ?? u.media_count_int),
    isPrivate: Boolean(u.is_private ?? u.isPrivate ?? false),
    isVerified: Boolean(u.is_verified ?? u.isVerified ?? false)
  };
}

// Fetch the Instagram profile info for a username/handle/url. Returns null when
// the profile can't be found (bad handle, private lookup blocked, API error).
export async function fetchInstagramProfile(
  key: string,
  host: string,
  usernameOrUrl: string
): Promise<RapidProfile | null> {
  const h = (host && host.trim()) || 'social-api4.p.rapidapi.com';
  const q = encodeURIComponent(String(usernameOrUrl || '').trim().replace(/^@/, ''));
  const url = `https://${h}/v1/info?username_or_id_or_url=${q}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': h,
      'x-rapidapi-key': key
    }
  });
  if (!res.ok) throw new Error(`RapidAPI: HTTP ${res.status}`);
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('RapidAPI: resposta inválida'); }
  return normalizeProfile(data);
}
