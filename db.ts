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
  max: 10
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Default every connection to the Recife/Brazil timezone so timestamp
// operations on the database side are consistent with the application.
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'America/Recife'").catch((err) => {
    console.error('Failed to set session timezone:', err);
  });
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

// --- Integration settings (payment gateway + SMM delivery panel) ---
// Stored as a single JSONB row in the settings table so they can be configured
// from the admin panel instead of environment variables.
export interface IntegrationSettings {
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  smmApiUrl: string;
  smmApiKey: string;
}

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  smmApiUrl: '',
  smmApiKey: ''
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
