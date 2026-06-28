import { Pool, PoolClient } from 'pg';

// Initial catalog data is bundled so a fresh database can be seeded on first run.
import { SERVICES, PREBUILT_PLANS } from './src/data';

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
}

// --- Blog posts & comments ---
export interface BlogPostRecord {
  slug: string;
  title: string;
  description: string;
  content: string[];
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
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
  const result = await pool.query(`SELECT data FROM blog_posts ORDER BY published_at DESC`);
  return result.rows.map((r) => r.data);
}

export async function getBlogPost(slug: string): Promise<BlogPostRecord | null> {
  const result = await pool.query(`SELECT data FROM blog_posts WHERE slug = $1`, [slug]);
  return result.rows[0]?.data || null;
}

export async function saveBlogPost(post: BlogPostRecord, publishedAt?: string): Promise<BlogPostRecord> {
  await pool.query(
    `INSERT INTO blog_posts (slug, data, published_at)
     VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data`,
    [post.slug, JSON.stringify(post), publishedAt || null]
  );
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
  smtpSecure: false
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
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'ImpulsioneGram',
  logoUrl: '',
  faviconUrl: '',
  seoTitle: 'ImpulsioneGram | Impulsione suas Redes Sociais',
  seoDescription:
    'Plataforma premium para impulsionar suas redes sociais com seguidores, curtidas e visualizações reais e brasileiros.',
  timezone: 'America/Recife',
  theme: 'default'
};

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const result = await pool.query(`SELECT value FROM settings WHERE key = 'general'`);
  return { ...DEFAULT_GENERAL_SETTINGS, ...(result.rows[0]?.value || {}) };
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
