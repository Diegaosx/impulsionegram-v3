import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Initial catalog data is bundled so a fresh database can be seeded on first run.
import { SERVICES, PREBUILT_PLANS, TESTIMONIALS } from './src/data';

// --- Shared domain types (also consumed by server.ts) ---
export interface UserItem {
  id: string;
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Ativo' | 'Bloqueado';
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  alertBannerText: string;
  companyWhatsApp: string;
  companyEmail: string;
}

export interface DBStructure {
  services: typeof SERVICES;
  plans: typeof PREBUILT_PLANS;
  orders: any[];
  users: UserItem[];
  homeContent: HomeContent;
}

// --- Seed data used to bootstrap an empty database ---
export const SEED_ORDERS = [
  {
    id: 'TRX-824195',
    username: '@juliana.vasconcelos',
    platform: 'instagram',
    serviceLabel: 'Seguidores Brasileiros',
    quantity: 2000,
    price: 49.9,
    paymentMethod: 'Card',
    email: 'juliana.vasc@gmail.com',
    phone: '(11) 98765-4321',
    date: '2026-06-01T10:15:30Z',
    status: 'Entregue'
  },
  {
    id: 'TRX-412781',
    username: '@burguer_gourmet_br',
    platform: 'instagram',
    serviceLabel: 'Curtidas Premium',
    quantity: 500,
    price: 19.9,
    paymentMethod: 'PIX',
    email: 'renan_burguer@outlook.com',
    phone: '(21) 91234-5678',
    date: '2026-06-01T12:05:00Z',
    status: 'Entregue'
  },
  {
    id: 'TRX-918234',
    username: '@gamer_becker_tt',
    platform: 'tiktok',
    serviceLabel: 'Seguidores TikTok',
    quantity: 5000,
    price: 119.9,
    paymentMethod: 'PIX',
    email: 'leticia.becker@gamer.com',
    phone: '(47) 99888-7777',
    date: '2026-06-01T14:10:12Z',
    status: 'Aprovado'
  }
];

export const SEED_USERS: UserItem[] = [
  {
    id: 'USR-001',
    username: '@juliana.vasconcelos',
    email: 'juliana.vasc@gmail.com',
    phone: '(11) 98765-4321',
    createdAt: '2026-06-01T10:10:00Z',
    ordersCount: 1,
    totalSpent: 49.9,
    status: 'Ativo'
  },
  {
    id: 'USR-002',
    username: '@burguer_gourmet_br',
    email: 'renan_burguer@outlook.com',
    phone: '(21) 91234-5678',
    createdAt: '2026-06-01T12:00:00Z',
    ordersCount: 1,
    totalSpent: 19.9,
    status: 'Ativo'
  },
  {
    id: 'USR-003',
    username: '@gamer_becker_tt',
    email: 'leticia.becker@gamer.com',
    phone: '(47) 99888-7777',
    createdAt: '2026-06-01T14:05:00Z',
    ordersCount: 1,
    totalSpent: 119.9,
    status: 'Ativo'
  }
];

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroTitle: 'Impulsione Suas Redes Sociais com Seguidores Reais',
  heroSubtitle:
    'Aumente sua autoridade, alcance orgânico e vendas com nossa entrega natural e segura. Resultados garantidos em minutos.',
  alertBannerText: 'OFERTA RELÂMPAGO DE INVERNO: 20% OFF EXTRA NO PIX',
  companyWhatsApp: '5511999999999',
  companyEmail: 'suporte@impulsionegram.com'
};

export function getDefaultData(): DBStructure {
  return {
    services: SERVICES,
    plans: PREBUILT_PLANS,
    orders: SEED_ORDERS,
    users: SEED_USERS,
    homeContent: DEFAULT_HOME_CONTENT
  };
}

// --- PostgreSQL connection pool ---
const connectionString = process.env.DATABASE_URL;

function resolveSsl(): false | { rejectUnauthorized: boolean } {
  // Explicit override wins.
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DATABASE_SSL === 'false') return false;
  const conn = connectionString || '';
  // Local development hosts never use SSL.
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(conn);
  // Railway's private network (e.g. postgres.railway.internal) does not support
  // SSL, so treat *.internal hosts like local connections.
  const isInternal = /\.railway\.internal|\.internal[:/]/.test(conn);
  return isLocal || isInternal ? false : { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: resolveSsl(),
  max: 10,
  // Default every connection to the Recife/Brazil timezone at startup so
  // timestamp operations on the database side are consistent with the app.
  // Using the startup parameter avoids an extra per-connection query.
  options: '-c timezone=America/Recife'
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export { pool };

// Collections stored as id + JSONB documents, ordered by insertion sequence so
// the exact ordering of the previous JSON-file storage is preserved.
const COLLECTION_TABLES = ['services', 'plans', 'orders', 'users'] as const;

async function createSchema(client: PoolClient) {
  for (const table of COLLECTION_TABLES) {
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id   TEXT PRIMARY KEY,
        seq  BIGSERIAL,
        data JSONB NOT NULL
      )`
    );
  }
  await client.query(
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS cookie_consents (
      id         TEXT PRIMARY KEY,
      choices    JSONB NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS blog_posts (
      slug         TEXT PRIMARY KEY,
      data         JSONB NOT NULL,
      published_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS blog_comments (
      id         TEXT PRIMARY KEY,
      post_slug  TEXT NOT NULL,
      author     TEXT,
      email      TEXT,
      content    TEXT,
      status     TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS blog_categories (
      name       TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS blog_tags (
      name       TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS testimonials (
      id         TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      status     TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS blocked_ips (
      ip         TEXT PRIMARY KEY,
      reason     TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  await client.query(
    `CREATE TABLE IF NOT EXISTS accounts (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      phone         TEXT,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'cliente',
      avatar        TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  // Blocked flag added after the initial release — apply idempotently.
  await client.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false`);
  await client.query(
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'unread',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
}

// --- Contact messages (help / "Fale Conosco" form) ---
export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

function mapContactMessage(r: any): ContactMessageRecord {
  return {
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    subject: r.subject || '',
    message: r.message || '',
    status: r.status === 'read' ? 'read' : 'unread',
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
  };
}

export async function addContactMessage(
  id: string,
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<ContactMessageRecord> {
  const r = await pool.query(
    `INSERT INTO contact_messages (id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, name, email, subject, message]
  );
  return mapContactMessage(r.rows[0]);
}

export async function listContactMessages(limit = 500): Promise<ContactMessageRecord[]> {
  const r = await pool.query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1`, [limit]);
  return r.rows.map(mapContactMessage);
}

export async function updateContactMessageStatus(id: string, status: string): Promise<void> {
  await pool.query(`UPDATE contact_messages SET status = $2 WHERE id = $1`, [id, status === 'read' ? 'read' : 'unread']);
}

export async function deleteContactMessage(id: string): Promise<void> {
  await pool.query(`DELETE FROM contact_messages WHERE id = $1`, [id]);
}

// --- User accounts (multi-user auth: admin + cliente) ---
export type AccountRole = 'admin' | 'cliente';

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
  avatar: string;
  blocked: boolean;
  createdAt: string;
}

const BCRYPT_ROUNDS = 10;

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizePhoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

function mapAccount(r: any): AccountRecord {
  return {
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    role: (r.role === 'admin' ? 'admin' : 'cliente'),
    avatar: r.avatar || '',
    blocked: r.blocked === true,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
  };
}

export async function createAccount(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: AccountRole;
}): Promise<AccountRecord> {
  const email = normalizeEmail(input.email);
  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const id = randomUUID();
  const role: AccountRole = input.role === 'admin' ? 'admin' : 'cliente';
  const result = await pool.query(
    `INSERT INTO accounts (id, name, email, phone, password_hash, role, avatar)
     VALUES ($1, $2, $3, $4, $5, $6, '') RETURNING *`,
    [id, String(input.name || '').trim(), email, String(input.phone || '').trim(), hash, role]
  );
  return mapAccount(result.rows[0]);
}

export async function getAccountById(id: string): Promise<AccountRecord | null> {
  const r = await pool.query(`SELECT * FROM accounts WHERE id = $1`, [id]);
  return r.rows[0] ? mapAccount(r.rows[0]) : null;
}

export async function getAccountByEmail(email: string): Promise<AccountRecord | null> {
  const r = await pool.query(`SELECT * FROM accounts WHERE email = $1`, [normalizeEmail(email)]);
  return r.rows[0] ? mapAccount(r.rows[0]) : null;
}

// Verify credentials; returns the public account on success, null otherwise.
export async function verifyAccountCredentials(email: string, password: string): Promise<AccountRecord | null> {
  const r = await pool.query(`SELECT * FROM accounts WHERE email = $1`, [normalizeEmail(email)]);
  const row = r.rows[0];
  if (!row) return null;
  if (row.blocked === true) return null; // blocked accounts cannot log in
  const ok = await bcrypt.compare(String(password || ''), row.password_hash);
  return ok ? mapAccount(row) : null;
}

// Check whether an email and/or phone already belong to an account.
export async function findAccountByEmailOrPhone(email: string, phone: string): Promise<{
  emailMatch: AccountRecord | null;
  phoneMatch: AccountRecord | null;
}> {
  const e = normalizeEmail(email);
  const p = normalizePhoneDigits(phone);
  const emailRes = e ? await pool.query(`SELECT * FROM accounts WHERE email = $1`, [e]) : { rows: [] as any[] };
  const phoneRes = p
    ? await pool.query(`SELECT * FROM accounts WHERE regexp_replace(coalesce(phone,''), '\\D', '', 'g') = $1`, [p])
    : { rows: [] as any[] };
  return {
    emailMatch: emailRes.rows[0] ? mapAccount(emailRes.rows[0]) : null,
    phoneMatch: phoneRes.rows[0] ? mapAccount(phoneRes.rows[0]) : null
  };
}

export async function updateAccountProfile(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}): Promise<AccountRecord | null> {
  const current = await pool.query(`SELECT * FROM accounts WHERE id = $1`, [id]);
  if (!current.rows[0]) return null;
  const cur = current.rows[0];
  const name = data.name !== undefined ? String(data.name).trim() : cur.name;
  const email = data.email !== undefined ? normalizeEmail(data.email) : cur.email;
  const phone = data.phone !== undefined ? String(data.phone).trim() : cur.phone;
  const avatar = data.avatar !== undefined ? String(data.avatar).trim() : cur.avatar;
  const r = await pool.query(
    `UPDATE accounts SET name = $2, email = $3, phone = $4, avatar = $5 WHERE id = $1 RETURNING *`,
    [id, name, email, phone, avatar]
  );
  return mapAccount(r.rows[0]);
}

export async function updateAccountPassword(id: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);
  await pool.query(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [id, hash]);
}

// Verify a specific account's current password (used when changing password).
export async function checkAccountPassword(id: string, password: string): Promise<boolean> {
  const r = await pool.query(`SELECT password_hash FROM accounts WHERE id = $1`, [id]);
  if (!r.rows[0]) return false;
  return bcrypt.compare(String(password || ''), r.rows[0].password_hash);
}

export async function listAccounts(): Promise<AccountRecord[]> {
  const r = await pool.query(`SELECT * FROM accounts ORDER BY created_at DESC LIMIT 1000`);
  return r.rows.map(mapAccount);
}

// Admin listing enriched with each account's order count and total spent
// (matched by linked accountId or e-mail, like listOrdersForAccount).
export interface AccountWithStats extends AccountRecord {
  ordersCount: number;
  totalSpent: number;
}

export async function listAccountsWithStats(): Promise<AccountWithStats[]> {
  const r = await pool.query(
    `SELECT a.*,
       (SELECT COUNT(*) FROM orders o
          WHERE o.data->>'accountId' = a.id
             OR lower(coalesce(o.data->>'email','')) = lower(a.email))::int AS orders_count,
       (SELECT COALESCE(SUM(NULLIF(o.data->>'price','')::numeric), 0) FROM orders o
          WHERE o.data->>'accountId' = a.id
             OR lower(coalesce(o.data->>'email','')) = lower(a.email)) AS total_spent
     FROM accounts a
     ORDER BY a.created_at DESC
     LIMIT 1000`
  );
  return r.rows.map((row) => ({
    ...mapAccount(row),
    ordersCount: Number(row.orders_count) || 0,
    totalSpent: Number(row.total_spent) || 0
  }));
}

// Admin update of an account's editable fields (name/email/phone/role/blocked).
export async function adminUpdateAccount(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  role?: AccountRole;
  blocked?: boolean;
}): Promise<AccountRecord | null> {
  const current = await pool.query(`SELECT * FROM accounts WHERE id = $1`, [id]);
  if (!current.rows[0]) return null;
  const cur = current.rows[0];
  const name = data.name !== undefined ? String(data.name).trim() : cur.name;
  const email = data.email !== undefined ? normalizeEmail(data.email) : cur.email;
  const phone = data.phone !== undefined ? String(data.phone).trim() : cur.phone;
  const role = data.role === 'admin' || data.role === 'cliente' ? data.role : cur.role;
  const blocked = data.blocked !== undefined ? data.blocked === true : cur.blocked;
  const r = await pool.query(
    `UPDATE accounts SET name = $2, email = $3, phone = $4, role = $5, blocked = $6 WHERE id = $1 RETURNING *`,
    [id, name, email, phone, role, blocked]
  );
  return mapAccount(r.rows[0]);
}

export async function setAccountBlocked(id: string, blocked: boolean): Promise<void> {
  await pool.query(`UPDATE accounts SET blocked = $2 WHERE id = $1`, [id, blocked === true]);
}

export async function deleteAccount(id: string): Promise<void> {
  await pool.query(`DELETE FROM accounts WHERE id = $1`, [id]);
}

export async function countAdmins(): Promise<number> {
  const r = await pool.query(`SELECT COUNT(*)::int AS count FROM accounts WHERE role = 'admin' AND blocked = false`);
  return Number(r.rows[0]?.count) || 0;
}

export async function getOrderById(id: string): Promise<any | null> {
  const r = await pool.query(`SELECT data FROM orders WHERE id = $1`, [id]);
  return r.rows[0]?.data || null;
}

// Shallow-merge a patch into an order's JSONB document.
export async function patchOrderData(id: string, patch: Record<string, any>): Promise<void> {
  await pool.query(`UPDATE orders SET data = data || $2::jsonb WHERE id = $1`, [id, JSON.stringify(patch)]);
}

// Orders that belong to a given account — matched by linked accountId or by the
// account's e-mail (for orders placed before the account existed / guest flow).
export async function listOrdersForAccount(accountId: string, email: string): Promise<any[]> {
  const e = normalizeEmail(email);
  const r = await pool.query(
    `SELECT data FROM orders
     WHERE data->>'accountId' = $1
        OR ($2 <> '' AND lower(coalesce(data->>'email','')) = $2)
     ORDER BY seq DESC`,
    [accountId, e]
  );
  return r.rows.map((x) => x.data);
}

// Seed a bootstrap admin account from env on first run so the admin can use the
// profile/password screens like any other user.
async function seedAdminAccount(client: PoolClient) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const email = normalizeEmail(process.env.ADMIN_EMAIL || `${username}@admin.local`);
  const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM accounts WHERE role = 'admin'`);
  if (rows[0]?.count > 0) return;
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await client.query(
    `INSERT INTO accounts (id, name, email, phone, password_hash, role, avatar)
     VALUES ($1, $2, $3, '', $4, 'admin', '')
     ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), 'Administrador', email, hash]
  );
  console.log(`Seeded bootstrap admin account (${email}).`);
}

// --- Blocked IPs (antispam permanent bans) ---
export interface BlockedIpRecord {
  ip: string;
  reason: string;
  createdAt: string;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const r = await pool.query(`SELECT 1 FROM blocked_ips WHERE ip = $1`, [ip]);
  return r.rowCount! > 0;
}

export async function blockIp(ip: string, reason: string): Promise<void> {
  if (!ip) return;
  await pool.query(
    `INSERT INTO blocked_ips (ip, reason) VALUES ($1, $2) ON CONFLICT (ip) DO NOTHING`,
    [ip, reason]
  );
}

export async function unblockIp(ip: string): Promise<void> {
  await pool.query(`DELETE FROM blocked_ips WHERE ip = $1`, [ip]);
}

export async function listBlockedIps(limit = 500): Promise<BlockedIpRecord[]> {
  const r = await pool.query(
    `SELECT ip, reason, created_at FROM blocked_ips ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return r.rows.map((x) => ({
    ip: x.ip,
    reason: x.reason || '',
    createdAt: x.created_at instanceof Date ? x.created_at.toISOString() : String(x.created_at)
  }));
}

// --- Blog categories & tags ---
export async function listBlogCategories(): Promise<string[]> {
  const r = await pool.query(`SELECT name FROM blog_categories ORDER BY name ASC`);
  return r.rows.map((x) => x.name);
}

export async function addBlogCategory(name: string): Promise<void> {
  if (!name.trim()) return;
  await pool.query(`INSERT INTO blog_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name.trim()]);
}

export async function deleteBlogCategory(name: string): Promise<void> {
  await pool.query(`DELETE FROM blog_categories WHERE name = $1`, [name]);
}

export async function listBlogTags(): Promise<string[]> {
  const r = await pool.query(`SELECT name FROM blog_tags ORDER BY name ASC`);
  return r.rows.map((x) => x.name);
}

export async function deleteBlogTag(name: string): Promise<void> {
  await pool.query(`DELETE FROM blog_tags WHERE name = $1`, [name]);
}

async function registerCategoriesAndTags(categories: string[], tags: string[]) {
  for (const c of categories || []) {
    const v = String(c).trim();
    if (v) await pool.query(`INSERT INTO blog_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [v]);
  }
  for (const t of tags || []) {
    const v = String(t).trim();
    if (v) await pool.query(`INSERT INTO blog_tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [v]);
  }
}

// --- Blog posts & comments ---
export interface BlogPostRecord {
  slug: string;
  title: string;
  description: string;
  content: string; // HTML
  categories: string[];
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  publishedAt?: string; // ISO timestamp from the published_at column (for SEO)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Convert legacy paragraph arrays into HTML (one-time, on read).
function legacyContentToHtml(arr: string[]): string {
  return arr.map((p) => {
    const t = (p || '').trim();
    if (!t) return '';
    if (t.startsWith('•')) return `<ul><li>${escapeHtml(t.replace(/^•\s*/, ''))}</li></ul>`;
    return `<p>${escapeHtml(t)}</p>`;
  }).join('');
}

// Normalize stored posts (older posts may use a single `category` and a
// paragraph array for content).
function normalizePost(data: any, publishedAt?: string): BlogPostRecord {
  const categories = Array.isArray(data.categories)
    ? data.categories
    : (data.category ? [data.category] : []);
  const content = Array.isArray(data.content)
    ? legacyContentToHtml(data.content)
    : String(data.content || '');
  return {
    slug: data.slug,
    title: data.title,
    description: data.description || '',
    content,
    categories,
    image: data.image || '',
    author: data.author || '',
    date: data.date || '',
    readTime: data.readTime || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    publishedAt
  };
}

function toIso(value: any): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

export interface BlogCommentRecord {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export async function listBlogPosts(): Promise<BlogPostRecord[]> {
  const result = await pool.query(`SELECT data, published_at FROM blog_posts ORDER BY published_at DESC`);
  return result.rows.map((r) => normalizePost(r.data, toIso(r.published_at)));
}

export async function getBlogPost(slug: string): Promise<BlogPostRecord | null> {
  const result = await pool.query(`SELECT data, published_at FROM blog_posts WHERE slug = $1`, [slug]);
  return result.rows[0]?.data ? normalizePost(result.rows[0].data, toIso(result.rows[0].published_at)) : null;
}

export async function saveBlogPost(post: BlogPostRecord, publishedAt?: string): Promise<BlogPostRecord> {
  await pool.query(
    `INSERT INTO blog_posts (slug, data, published_at)
     VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data`,
    [post.slug, JSON.stringify(post), publishedAt || null]
  );
  // Register any new categories/tags so they show up in the pickers.
  await registerCategoriesAndTags(post.categories, post.tags);
  return post;
}

export async function deleteBlogPost(slug: string): Promise<void> {
  await pool.query(`DELETE FROM blog_posts WHERE slug = $1`, [slug]);
  await pool.query(`DELETE FROM blog_comments WHERE post_slug = $1`, [slug]);
}

function mapComment(r: any): BlogCommentRecord {
  return {
    id: r.id,
    postSlug: r.post_slug,
    author: r.author || '',
    email: r.email || '',
    content: r.content || '',
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
  };
}

export async function listComments(postSlug: string, approvedOnly: boolean): Promise<BlogCommentRecord[]> {
  const result = approvedOnly
    ? await pool.query(`SELECT * FROM blog_comments WHERE post_slug = $1 AND status = 'approved' ORDER BY created_at ASC`, [postSlug])
    : await pool.query(`SELECT * FROM blog_comments WHERE post_slug = $1 ORDER BY created_at ASC`, [postSlug]);
  return result.rows.map(mapComment);
}

export async function listAllComments(): Promise<BlogCommentRecord[]> {
  const result = await pool.query(`SELECT * FROM blog_comments ORDER BY created_at DESC LIMIT 500`);
  return result.rows.map(mapComment);
}

export async function addComment(
  id: string,
  postSlug: string,
  author: string,
  email: string,
  content: string,
  status: string
): Promise<BlogCommentRecord> {
  const result = await pool.query(
    `INSERT INTO blog_comments (id, post_slug, author, email, content, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, postSlug, author, email, content, status]
  );
  return mapComment(result.rows[0]);
}

export async function updateCommentStatus(id: string, status: string): Promise<void> {
  await pool.query(`UPDATE blog_comments SET status = $2 WHERE id = $1`, [id, status]);
}

export async function deleteComment(id: string): Promise<void> {
  await pool.query(`DELETE FROM blog_comments WHERE id = $1`, [id]);
}

// --- Testimonials (home reviews) ---
export interface TestimonialRecord {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  platformUsed: string;
  verified: boolean;
  date: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

function mapTestimonial(r: any): TestimonialRecord {
  const d = r.data || {};
  return {
    id: r.id,
    name: d.name || '',
    role: d.role || '',
    avatar: d.avatar || '',
    rating: Number(d.rating) || 5,
    text: d.text || '',
    platformUsed: d.platformUsed || 'instagram',
    verified: d.verified !== false,
    date: d.date || '',
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
  };
}

// Build the JSONB payload (everything except moderation columns).
function testimonialPayload(t: Partial<TestimonialRecord>) {
  return {
    name: String(t.name || '').trim(),
    role: String(t.role || '').trim(),
    avatar: String(t.avatar || '').trim(),
    rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
    text: String(t.text || '').trim(),
    platformUsed: String(t.platformUsed || 'instagram'),
    verified: t.verified !== false,
    date: String(t.date || '').trim()
  };
}

export async function listTestimonials(approvedOnly: boolean): Promise<TestimonialRecord[]> {
  const result = approvedOnly
    ? await pool.query(`SELECT * FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC`)
    : await pool.query(`SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 500`);
  return result.rows.map(mapTestimonial);
}

export async function addTestimonial(
  id: string,
  data: Partial<TestimonialRecord>,
  status: string
): Promise<TestimonialRecord> {
  const result = await pool.query(
    `INSERT INTO testimonials (id, data, status) VALUES ($1, $2::jsonb, $3) RETURNING *`,
    [id, JSON.stringify(testimonialPayload(data)), status]
  );
  return mapTestimonial(result.rows[0]);
}

// Admin create/update (upsert) keeping the moderation status.
export async function saveTestimonial(
  id: string,
  data: Partial<TestimonialRecord>,
  status: string
): Promise<TestimonialRecord> {
  const result = await pool.query(
    `INSERT INTO testimonials (id, data, status) VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, status = EXCLUDED.status RETURNING *`,
    [id, JSON.stringify(testimonialPayload(data)), status]
  );
  return mapTestimonial(result.rows[0]);
}

export async function updateTestimonialStatus(id: string, status: string): Promise<void> {
  await pool.query(`UPDATE testimonials SET status = $2 WHERE id = $1`, [id, status]);
}

export async function deleteTestimonial(id: string): Promise<void> {
  await pool.query(`DELETE FROM testimonials WHERE id = $1`, [id]);
}

async function seedTestimonialsIfEmpty(client: PoolClient) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM testimonials');
  if (rows[0]?.count > 0) return;
  console.log('Seeding testimonials...');
  for (let i = 0; i < TESTIMONIALS.length; i++) {
    const t = TESTIMONIALS[i];
    const createdAt = new Date(Date.now() - i * 3600000).toISOString();
    await client.query(
      `INSERT INTO testimonials (id, data, status, created_at) VALUES ($1, $2::jsonb, 'approved', $3)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, JSON.stringify(testimonialPayload(t as any)), createdAt]
    );
  }
}

async function seedBlogIfEmpty(client: PoolClient) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM blog_posts');
  if (rows[0]?.count > 0) return;
  console.log('Seeding blog posts and comments...');
  const { BLOG_SEED_POSTS, BLOG_SEED_COMMENTS } = await import('./blogSeed');
  // Insert posts newest-first so published_at ordering matches the seed array.
  for (let i = 0; i < BLOG_SEED_POSTS.length; i++) {
    const post = BLOG_SEED_POSTS[i];
    const publishedAt = new Date(Date.now() - i * 86400000).toISOString();
    await client.query(
      `INSERT INTO blog_posts (slug, data, published_at) VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [post.slug, JSON.stringify(post), publishedAt]
    );
  }
  for (const c of BLOG_SEED_COMMENTS) {
    await client.query(
      `INSERT INTO blog_comments (id, post_slug, author, email, content, status)
       VALUES ($1, $2, $3, $4, $5, 'approved') ON CONFLICT (id) DO NOTHING`,
      [c.id, c.postSlug, c.author, c.email, c.content]
    );
  }
  // Seed categories and tags from the seed posts.
  const catSet = new Set<string>(['Instagram', 'TikTok', 'Marketing Digital', 'Dicas']);
  const tagSet = new Set<string>();
  for (const post of BLOG_SEED_POSTS) {
    if (post.category) catSet.add(post.category);
    (post.tags || []).forEach((t) => tagSet.add(t));
  }
  for (const name of catSet) {
    await client.query(`INSERT INTO blog_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
  }
  for (const name of tagSet) {
    await client.query(`INSERT INTO blog_tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
  }
}

// For databases that already had blog posts before categories/tags existed,
// backfill the registries from the existing posts (runs once, when empty).
async function backfillCategoriesAndTags(client: PoolClient) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM blog_categories');
  if (rows[0]?.count > 0) return;
  const posts = await client.query('SELECT data FROM blog_posts');
  const cats = new Set<string>(['Instagram', 'TikTok', 'Marketing Digital', 'Dicas']);
  const tags = new Set<string>();
  for (const r of posts.rows) {
    const d = r.data || {};
    const postCats = Array.isArray(d.categories) ? d.categories : (d.category ? [d.category] : []);
    postCats.forEach((c: string) => c && cats.add(c));
    (Array.isArray(d.tags) ? d.tags : []).forEach((t: string) => t && tags.add(t));
  }
  for (const name of cats) {
    await client.query(`INSERT INTO blog_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
  }
  for (const name of tags) {
    await client.query(`INSERT INTO blog_tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
  }
}

// --- Cookie consent (LGPD) records ---
export interface CookieChoices {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  id: string;
  choices: CookieChoices;
  userAgent: string;
  createdAt: string;
}

export async function saveCookieConsent(
  id: string,
  choices: CookieChoices,
  userAgent: string
): Promise<void> {
  await pool.query(
    `INSERT INTO cookie_consents (id, choices, user_agent)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE SET choices = EXCLUDED.choices, user_agent = EXCLUDED.user_agent, created_at = now()`,
    [id, JSON.stringify(choices), userAgent]
  );
}

export async function listCookieConsents(limit = 300): Promise<CookieConsentRecord[]> {
  const result = await pool.query(
    `SELECT id, choices, user_agent, created_at FROM cookie_consents ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map((r) => ({
    id: r.id,
    choices: r.choices,
    userAgent: r.user_agent || '',
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
  }));
}

async function replaceCollection(client: PoolClient, table: string, items: any[]) {
  await client.query(`DELETE FROM ${table}`);
  for (const item of items || []) {
    if (!item || item.id === undefined || item.id === null) {
      throw new Error(`Item in "${table}" is missing required "id" field`);
    }
    await client.query(
      `INSERT INTO ${table} (id, data) VALUES ($1, $2::jsonb)`,
      [String(item.id), JSON.stringify(item)]
    );
  }
}

async function readCollection(table: string): Promise<any[]> {
  const result = await pool.query(`SELECT data FROM ${table} ORDER BY seq ASC`);
  return result.rows.map((row) => row.data);
}

/**
 * Ensure the schema exists and seed default data on a brand-new database.
 */
export async function initDB(): Promise<void> {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Configure a PostgreSQL connection string before starting the server.'
    );
  }

  const client = await pool.connect();
  try {
    await createSchema(client);

    // Seed only when the services table is empty (treat as a fresh database).
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM services');
    const isEmpty = rows[0]?.count === 0;
    if (isEmpty) {
      console.log('Empty database detected, seeding default data...');
      await writeDB(getDefaultData());
    }

    // Always guarantee a homeContent row exists.
    await client.query(
      `INSERT INTO settings (key, value)
       VALUES ('homeContent', $1::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify(DEFAULT_HOME_CONTENT)]
    );

    // Seed blog content on a fresh blog table.
    await seedBlogIfEmpty(client);
    // Backfill categories/tags for databases seeded before they existed.
    await backfillCategoriesAndTags(client);
    // Seed home testimonials on a fresh testimonials table.
    await seedTestimonialsIfEmpty(client);
    // Ensure a bootstrap admin account exists for the profile/login system.
    await seedAdminAccount(client);

    console.log('PostgreSQL database initialized successfully.');
  } finally {
    client.release();
  }
}

/**
 * Read the full application state from PostgreSQL, assembling the same shape
 * that the previous JSON-file storage exposed.
 */
export async function readDB(): Promise<DBStructure> {
  const [services, plans, orders, users, settings] = await Promise.all([
    readCollection('services'),
    readCollection('plans'),
    readCollection('orders'),
    readCollection('users'),
    pool.query(`SELECT value FROM settings WHERE key = 'homeContent'`)
  ]);

  const homeContent: HomeContent = {
    ...DEFAULT_HOME_CONTENT,
    ...(settings.rows[0]?.value || {})
  };

  return {
    services: services as DBStructure['services'],
    plans: plans as DBStructure['plans'],
    orders,
    users: users as UserItem[],
    homeContent
  };
}

/**
 * Persist the full application state to PostgreSQL inside a single transaction.
 */
export async function writeDB(data: DBStructure): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await replaceCollection(client, 'services', data.services as any[]);
    await replaceCollection(client, 'plans', data.plans as any[]);
    await replaceCollection(client, 'orders', data.orders);
    await replaceCollection(client, 'users', data.users);
    await client.query(
      `INSERT INTO settings (key, value)
       VALUES ('homeContent', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify({ ...DEFAULT_HOME_CONTENT, ...data.homeContent })]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// --- Company / contact / footer settings ---
// Single source of truth for contact info shown across the site (footer,
// contact section, floating WhatsApp button, FAQ).
export interface CompanySettings {
  footerDescription: string;
  copyrightText: string; // rendered after "© {year} "
  footerDisclaimer: string;
  contactEmail: string;
  whatsappNumber: string; // digits only, used in wa.me links
  whatsappDisplay: string; // formatted for display
  address: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTiktok: string;
  socialFacebook: string;
  socialTwitter: string;
  socialKwai: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  footerDescription:
    'Especialistas em marketing de alta performance de redes sociais desde 2018. Líderes nacionais no provimento de engajamento acelerado estável com contas reais brasileiras.',
  copyrightText: 'ImpulsioneGram. Todos os direitos reservados. CNPJ: 00.322.155/0001-99.',
  footerDisclaimer:
    'Isenção de responsabilidade: ImpulsioneGram é uma assessoria privada independente de engajamento social. Não possuímos representação oficial, patrocínio ou vínculo com as marcas registradas Instagram, TikTok, Facebook, YouTube, Twitter/X ou parentes correlatos. Todas as marcas nominadas servem meramente como caráter descritivo técnico informacional.',
  contactEmail: 'contato@impulsionegram.com.br',
  whatsappNumber: '5511999999999',
  whatsappDisplay: '(11) 99999-9999',
  address: 'Av. Paulista, 1000 - Bela Vista - São Paulo / SP',
  socialInstagram: 'https://instagram.com',
  socialYoutube: 'https://youtube.com',
  socialTiktok: 'https://tiktok.com',
  socialFacebook: '',
  socialTwitter: '',
  socialKwai: ''
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'company'`);
  return { ...DEFAULT_COMPANY_SETTINGS, ...(result.rows[0]?.value || {}) };
}

export async function saveCompanySettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
  const current = await getCompanySettings();
  const merged: CompanySettings = { ...current, ...data };
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('company', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// --- Integration settings (payment gateway + SMM delivery panel + SMTP) ---
// Stored as a single JSONB row in the settings table so they can be configured
// from the admin panel instead of environment variables.
export interface IntegrationSettings {
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  smmApiUrl: string;
  smmApiKey: string;
  emailProvider: 'smtp' | 'resend';
  resendApiKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  smtpSecure: boolean;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  recaptchaMinScore: string;
}

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  smmApiUrl: '',
  smmApiKey: '',
  emailProvider: 'smtp',
  resendApiKey: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  smtpFromName: '',
  smtpFromEmail: '',
  smtpSecure: false,
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
  recaptchaMinScore: '0.5'
};

// --- General site settings (branding, SEO, timezone, theme) ---
export interface GeneralSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  seoTitle: string;
  seoDescription: string;
  timezone: string;
  theme: string;
  plansEnabled: boolean;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'ImpulsioneGram',
  logoUrl: '',
  faviconUrl: '',
  seoTitle: 'ImpulsioneGram | Impulsione suas Redes Sociais',
  seoDescription:
    'Plataforma premium para impulsionar suas redes sociais com seguidores, curtidas e visualizações reais e brasileiros.',
  timezone: 'America/Recife',
  theme: 'default',
  plansEnabled: true
};

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'general'`);
  const merged = { ...DEFAULT_GENERAL_SETTINGS, ...(result.rows[0]?.value || {}) };
  merged.plansEnabled = merged.plansEnabled !== false; // default on
  return merged;
}

export async function saveGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
  const current = await getGeneralSettings();
  const merged: GeneralSettings = { ...current, ...data };
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('general', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// --- Flash offer / top promo bar (with a real, time-limited coupon discount) ---
export interface OfferSettings {
  enabled: boolean;
  text: string;
  discountPercent: number;
  couponCode: string;
  endsAt: string; // ISO datetime; empty = no expiry
}

export const DEFAULT_OFFER: OfferSettings = {
  enabled: false,
  text: 'OFERTA RELÂMPAGO: 20% OFF EXTRA NO PIX',
  discountPercent: 20,
  couponCode: 'PIX20',
  endsAt: ''
};

function normalizeOffer(raw: any): OfferSettings {
  const o = { ...DEFAULT_OFFER, ...(raw || {}) };
  return {
    enabled: o.enabled === true,
    text: String(o.text || ''),
    discountPercent: Math.max(0, Math.min(90, Number(o.discountPercent) || 0)),
    couponCode: String(o.couponCode || '').trim(),
    endsAt: String(o.endsAt || '')
  };
}

export async function getOffer(): Promise<OfferSettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'offer'`);
  return normalizeOffer(result.rows[0]?.value);
}

export async function saveOffer(data: Partial<OfferSettings>): Promise<OfferSettings> {
  const current = await getOffer();
  const merged = normalizeOffer({ ...current, ...data });
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('offer', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// --- Editable site pages (legal/policy content, rich HTML like the blog) ---
export type PageSlug = 'privacy' | 'terms' | 'warranty';
export const PAGE_SLUGS: PageSlug[] = ['privacy', 'terms', 'warranty'];
const PAGE_DEFAULT_TITLE: Record<PageSlug, string> = {
  privacy: 'Política de Privacidade',
  terms: 'Termos de Uso',
  warranty: 'Garantia / Devolução'
};

export interface SitePage {
  slug: PageSlug;
  title: string;
  html: string;
  updatedAt: string;
}

export function isValidPageSlug(slug: string): slug is PageSlug {
  return (PAGE_SLUGS as string[]).includes(slug);
}

export async function getPage(slug: PageSlug): Promise<SitePage> {
  const r = await pool.query(`SELECT value FROM settings WHERE key = $1`, [`page:${slug}`]);
  const v = r.rows[0]?.value || {};
  return {
    slug,
    title: String(v.title || PAGE_DEFAULT_TITLE[slug]),
    html: String(v.html || ''),
    updatedAt: String(v.updatedAt || '')
  };
}

export async function savePage(slug: PageSlug, data: { title?: string; html?: string }): Promise<SitePage> {
  const current = await getPage(slug);
  const merged = {
    title: data.title !== undefined ? String(data.title) : current.title,
    html: data.html !== undefined ? String(data.html) : current.html,
    updatedAt: new Date().toISOString()
  };
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [`page:${slug}`, JSON.stringify(merged)]
  );
  return { slug, ...merged };
}

// An offer is active when enabled and not past its end time.
export function isOfferActive(o: OfferSettings): boolean {
  if (!o.enabled) return false;
  if (o.discountPercent <= 0) return false;
  if (o.endsAt) {
    const t = Date.parse(o.endsAt);
    if (!Number.isNaN(t) && t <= Date.now()) return false;
  }
  return true;
}

// --- Floating widgets: WhatsApp button + Sofia AI chat assistant ---
export interface ChatbotQA { question: string; answer: string; }
export interface ChatbotSettings {
  chatEnabled: boolean;       // Sofia chat widget
  whatsappEnabled: boolean;   // floating WhatsApp button
  name: string;               // assistant name
  role: string;               // chip next to the name
  greeting: string;           // first message
  fallback: string;           // reply when nothing matches
  qa: ChatbotQA[];            // question -> answer (questions also power the chips)
}

export const DEFAULT_CHATBOT: ChatbotSettings = {
  chatEnabled: true,
  whatsappEnabled: true,
  name: 'Sofia IA',
  role: 'Especialista',
  greeting: 'Olá! Sou a Sofia, especialista de suporte na ImpulsioneGram. Estou aqui para te ajudar a escolher o melhor plano de crescimento para o seu perfil. Qual é a sua dúvida hoje?',
  fallback: 'Legal! Oferecemos os melhores pacotes de engajamento estável no Brasil para Instagram, TikTok e YouTube. Recomendo simular suas quantidades direto na nossa calculadora automática para obter até 30% de desconto!',
  qa: [
    { question: 'Quanto tempo leva a entrega?', answer: 'Nossa entrega é super rápida! O processamento começa automaticamente em até 10 minutos após o pagamento (no Pix é imediato). Configuramos o envio de forma natural e gradativa para garantir total segurança contra o algoritmo das redes sociais!' },
    { question: 'Preciso dar minha senha?', answer: 'Esqueça senhas! Nós nunca pediremos sua senha ou login em hipótese alguma. Todo o nosso sistema de envio é externo, o que torna o processo 100% seguro e livre de qualquer risco de bloqueio ou banimento do seu perfil.' },
    { question: 'Os seguidores somem?', answer: 'Damos garantia exclusiva de reposição de 30 dias! Se qualquer seguidor deixar de seguir, nosso reabastecimento inteligente repõe com apenas um clique. Usamos perfis muito estáveis.' },
    { question: 'Quais formas de pagamento?', answer: 'Aceitamos pagamento via PIX, com aprovação e processamento instantâneo, pelo ambiente seguro do Mercado Pago.' },
    { question: 'Como funciona a reposição?', answer: 'Se houver qualquer queda no período de garantia, você aciona a reposição pelo painel ou pelo nosso suporte e reabastecemos seu pedido automaticamente.' }
  ]
};

function normalizeChatbot(raw: any): ChatbotSettings {
  const c = { ...DEFAULT_CHATBOT, ...(raw || {}) };
  const qa = Array.isArray(c.qa)
    ? c.qa.map((x: any) => ({ question: String(x?.question || '').trim(), answer: String(x?.answer || '').trim() }))
          .filter((x: ChatbotQA) => x.question && x.answer)
    : DEFAULT_CHATBOT.qa;
  return {
    chatEnabled: c.chatEnabled !== false,
    whatsappEnabled: c.whatsappEnabled !== false,
    name: String(c.name || DEFAULT_CHATBOT.name),
    role: String(c.role || ''),
    greeting: String(c.greeting || ''),
    fallback: String(c.fallback || ''),
    qa
  };
}

export async function getChatbot(): Promise<ChatbotSettings> {
  const r = await pool.query(`SELECT value FROM settings WHERE key = 'chatbot'`);
  return normalizeChatbot(r.rows[0]?.value);
}

export async function saveChatbot(data: Partial<ChatbotSettings>): Promise<ChatbotSettings> {
  const current = await getChatbot();
  const merged = normalizeChatbot({ ...current, ...data });
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('chatbot', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// --- Custom JS / Analytics code injection ---
// Arbitrary code snippets (Google Analytics, AdSense, Tag Manager, pixels, etc.)
// injected into the document. "site" snippets apply to every page; "article"
// snippets are injected additionally on blog article pages.
export interface AnalyticsSettings {
  siteHeadCode: string;
  siteBodyCode: string;
  siteFooterCode: string;
  articleHeadCode: string;
  articleBodyCode: string;
  articleFooterCode: string;
}

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  siteHeadCode: '',
  siteBodyCode: '',
  siteFooterCode: '',
  articleHeadCode: '',
  articleBodyCode: '',
  articleFooterCode: ''
};

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'analytics'`);
  return { ...DEFAULT_ANALYTICS_SETTINGS, ...(result.rows[0]?.value || {}) };
}

export async function saveAnalyticsSettings(data: Partial<AnalyticsSettings>): Promise<AnalyticsSettings> {
  const current = await getAnalyticsSettings();
  const merged: AnalyticsSettings = { ...current, ...data };
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('analytics', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}

export async function getIntegrations(): Promise<IntegrationSettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'integrations'`);
  return { ...DEFAULT_INTEGRATIONS, ...(result.rows[0]?.value || {}) };
}

export async function saveIntegrations(data: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
  const current = await getIntegrations();
  const merged: IntegrationSettings = { ...current, ...data };
  await pool.query(
    `INSERT INTO settings (key, value)
     VALUES ('integrations', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(merged)]
  );
  return merged;
}
