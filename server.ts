import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

// PostgreSQL persistence layer (replaces the previous JSON-file storage).
import {
  readDB,
  writeDB,
  initDB,
  getDefaultData,
  DEFAULT_HOME_CONTENT,
  UserItem,
  getIntegrations,
  saveIntegrations,
  getAnalyticsSettings,
  saveAnalyticsSettings,
  getGeneralSettings,
  saveGeneralSettings,
  getCompanySettings,
  saveCompanySettings,
  saveCookieConsent,
  listCookieConsents,
  listBlogPosts,
  saveBlogPost,
  deleteBlogPost,
  listComments,
  listAllComments,
  addComment,
  updateCommentStatus,
  deleteComment,
  listBlogCategories,
  addBlogCategory,
  deleteBlogCategory,
  listBlogTags,
  deleteBlogTag,
  listTestimonials,
  addTestimonial,
  saveTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
  listBlockedIps,
  unblockIp,
  createAccount,
  getAccountById,
  getAccountByEmail,
  verifyAccountCredentials,
  findAccountByEmailOrPhone,
  updateAccountProfile,
  updateAccountPassword,
  checkAccountPassword
} from './db';
import { uploadToR2, isR2Configured } from './r2';
import { verifyRecaptcha } from './recaptcha';
import { stripLinks } from './sanitize';
import { checkSubmissionRate, initRateLimiter } from './rateLimit';
import {
  signAdminToken, signAccountToken, getAdminCredentials, requireAdmin, requireAuth, getPayload
} from './auth';

const app = express();
const PORT = 3000;

// Behind Railway's proxy, the real client IP is in X-Forwarded-For. Trusting the
// proxy makes req.ip resolve to the visitor's address (used for rate limiting).
app.set('trust proxy', true);

app.use(express.json());

// Translate a rate-limit verdict into a client-friendly error message.
function rateLimitMessage(reason?: string, retryAfterSeconds?: number): string {
  if (reason === 'blocked') {
    return 'Seu acesso para envios foi bloqueado por excesso de tentativas. Entre em contato com o suporte se isso for um engano.';
  }
  const mins = retryAfterSeconds ? Math.max(1, Math.ceil(retryAfterSeconds / 60)) : 10;
  return `Você enviou recentemente. Aguarde cerca de ${mins} minuto(s) antes de enviar novamente.`;
}

// --- ADMIN AUTH GATE (fail-closed) ---
// Every /api route requires a valid admin JWT EXCEPT the explicit allowlist of
// public endpoints below. New routes are protected by default. Paths here are
// relative to the /api mount (e.g. "/services").
const PUBLIC_API: { method: string; re: RegExp }[] = [
  { method: 'POST', re: /^\/login\/?$/ },
  { method: 'POST', re: /^\/auth\/login\/?$/ },
  { method: 'POST', re: /^\/auth\/register\/?$/ },
  { method: 'POST', re: /^\/auth\/check\/?$/ },
  { method: 'GET', re: /^\/services\/?$/ },
  { method: 'GET', re: /^\/plans\/?$/ },
  { method: 'GET', re: /^\/home\/?$/ },
  { method: 'GET', re: /^\/settings\/?$/ },
  { method: 'GET', re: /^\/company\/?$/ },
  { method: 'GET', re: /^\/public-config\/?$/ },
  { method: 'GET', re: /^\/analytics\/?$/ },
  { method: 'POST', re: /^\/cookie-consents\/?$/ },
  { method: 'GET', re: /^\/blog\/posts\/?$/ },
  { method: 'GET', re: /^\/blog\/comments\/?$/ },
  { method: 'POST', re: /^\/blog\/comments\/?$/ },
  { method: 'GET', re: /^\/blog\/categories\/?$/ },
  { method: 'GET', re: /^\/blog\/tags\/?$/ },
  { method: 'GET', re: /^\/testimonials\/?$/ },
  { method: 'POST', re: /^\/testimonials\/?$/ },
  { method: 'POST', re: /^\/orders\/?$/ }
];

// Routes any authenticated user (admin OR cliente) may access.
const AUTH_API: { method: string; re: RegExp }[] = [
  { method: 'GET', re: /^\/auth\/me\/?$/ },
  { method: 'PUT', re: /^\/auth\/profile\/?$/ },
  { method: 'PUT', re: /^\/auth\/password\/?$/ },
  { method: 'POST', re: /^\/upload\/?$/ },
  { method: 'GET', re: /^\/my\// },
  { method: 'POST', re: /^\/my\// }
];

app.use('/api', (req, res, next) => {
  const path = req.path; // relative to the /api mount
  const isPublic = PUBLIC_API.some((r) => r.method === req.method && r.re.test(path));
  // The list endpoints for comments/testimonials are public for the approved
  // feed, but the admin "?all=1" variant (which exposes pending/hidden items)
  // requires authentication.
  const adminOnlyVariant = (path === '/blog/comments' || path === '/testimonials') && req.query.all === '1';
  if (isPublic && !adminOnlyVariant) return next();
  // Authenticated-user (any role) routes.
  if (AUTH_API.some((r) => r.method === req.method && r.re.test(path))) {
    return requireAuth(req, res, next);
  }
  // Everything else is admin-only.
  return requireAdmin(req, res, next);
});

// In-memory upload handling (files are streamed straight to Cloudflare R2).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// --- API ROUTES ---

// 1. Get current services list
app.get('/api/services', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.services);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Update service catalog
app.put('/api/services', async (req, res) => {
  try {
    const updatedServices = req.body;
    if (!Array.isArray(updatedServices)) {
      return res.status(400).json({ error: 'Body must be an array of services' });
    }
    const db = await readDB();
    db.services = updatedServices;
    await writeDB(db);
    res.json({ success: true, services: db.services });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Get fast prebuilt plans
app.get('/api/plans', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.plans);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Update plans catalog
app.put('/api/plans', async (req, res) => {
  try {
    const updatedPlans = req.body;
    if (!Array.isArray(updatedPlans)) {
      return res.status(400).json({ error: 'Body must be an array of plans' });
    }
    const db = await readDB();
    db.plans = updatedPlans;
    await writeDB(db);
    res.json({ success: true, plans: db.plans });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Get recent orders
app.get('/api/orders', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.orders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5b. Get users list
app.get('/api/users', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.users || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5c. Update users list (block/unblock or delete)
app.put('/api/users', async (req, res) => {
  try {
    const updatedUsers = req.body;
    if (!Array.isArray(updatedUsers)) {
      return res.status(400).json({ error: 'Body must be an array of users' });
    }
    const db = await readDB();
    db.users = updatedUsers;
    await writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5d. Get general home content
app.get('/api/home', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.homeContent || DEFAULT_HOME_CONTENT);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5e. Update general home content
app.put('/api/home', async (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid home content object' });
    }
    const db = await readDB();
    db.homeContent = { ...DEFAULT_HOME_CONTENT, ...newContent };
    await writeDB(db);
    res.json({ success: true, homeContent: db.homeContent });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f. Auth Admin Login
// Legacy admin login (username/password). Resolves to the bootstrap admin
// account so the issued token carries the account id; falls back to the env
// credentials for safety.
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const creds = getAdminCredentials();
    const email = String(username || '').includes('@')
      ? String(username)
      : (process.env.ADMIN_EMAIL || `${creds.username}@admin.local`);
    const account = await verifyAccountCredentials(email, String(password || ''));
    if (account) {
      return res.json({ success: true, token: signAccountToken(account), message: 'Autenticado com sucesso' });
    }
    if (username === creds.username && password === creds.password) {
      return res.json({ success: true, token: signAdminToken(String(username)), message: 'Autenticado com sucesso' });
    }
    return res.status(401).json({ success: false, error: 'Usuário ou senha incorretos' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- ACCOUNTS / AUTH ---

function publicUser(a: any) {
  return { id: a.id, name: a.name, email: a.email, phone: a.phone, role: a.role, avatar: a.avatar, createdAt: a.createdAt };
}

// Register a new client account.
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres.' });
    }
    const existing = await getAccountByEmail(String(email));
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma conta com este e-mail. Faça login.' });
    }
    const account = await createAccount({ name, email, phone, password, role: 'cliente' });
    const token = signAccountToken(account);
    res.json({ success: true, token, user: publicUser(account) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Login with email + password (admin or cliente).
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const account = await verifyAccountCredentials(String(email || ''), String(password || ''));
    if (!account) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    const token = signAccountToken(account);
    res.json({ success: true, token, user: publicUser(account) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Check whether an email/phone already belongs to an account (used at checkout).
app.post('/api/auth/check', async (req, res) => {
  try {
    const { email, phone } = req.body || {};
    const { emailMatch, phoneMatch } = await findAccountByEmailOrPhone(String(email || ''), String(phone || ''));
    res.json({ emailExists: !!emailMatch, phoneExists: !!phoneMatch, exists: !!(emailMatch || phoneMatch) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Current authenticated user.
app.get('/api/auth/me', async (req, res) => {
  try {
    const payload = getPayload(req)!;
    const account = await getAccountById(payload.sub);
    if (!account) {
      // Env-admin token without a backing account row.
      return res.json({ user: { id: payload.sub, name: payload.name || 'Administrador', email: payload.email || '', phone: '', role: payload.role, avatar: '', createdAt: '' } });
    }
    res.json({ user: publicUser(account) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update the current user's profile (name, email, phone, avatar).
app.put('/api/auth/profile', async (req, res) => {
  try {
    const payload = getPayload(req)!;
    const { name, email, phone, avatar } = req.body || {};
    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      const other = await getAccountByEmail(normalized);
      if (other && other.id !== payload.sub) {
        return res.status(409).json({ error: 'Este e-mail já está em uso por outra conta.' });
      }
    }
    const updated = await updateAccountProfile(payload.sub, { name, email, phone, avatar });
    if (!updated) return res.status(404).json({ error: 'Conta não encontrada.' });
    // Re-issue the token so the name/email in it stay current.
    const token = signAccountToken(updated);
    res.json({ success: true, token, user: publicUser(updated) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Change the current user's password.
app.put('/api/auth/password', async (req, res) => {
  try {
    const payload = getPayload(req)!;
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres.' });
    }
    const ok = await checkAccountPassword(payload.sub, String(currentPassword || ''));
    if (!ok) return res.status(400).json({ error: 'Senha atual incorreta.' });
    await updateAccountPassword(payload.sub, String(newPassword));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-1. Get general site settings (branding, SEO, timezone, theme)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getGeneralSettings();
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-2. Update general site settings
app.put('/api/settings', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid settings object' });
    }
    const saved = await saveGeneralSettings(body);
    res.json({ success: true, settings: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-3. Upload an asset (logo, favicon, product image...) to Cloudflare R2
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: 'Upload de arquivos indisponível: o Cloudflare R2 não está configurado no servidor.'
      });
    }
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado (campo "file").' });
    }
    const folder = typeof req.body.folder === 'string' && req.body.folder ? req.body.folder : 'uploads';
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${safeFolder}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    const url = await uploadToR2(file.buffer, key, file.mimetype || 'application/octet-stream');
    res.json({ success: true, url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-4. Get company/contact/footer settings
app.get('/api/company', async (req, res) => {
  try {
    const company = await getCompanySettings();
    res.json(company);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-5. Update company/contact/footer settings
app.put('/api/company', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid company settings object' });
    }
    const saved = await saveCompanySettings(body);
    res.json({ success: true, company: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-6. Record a cookie consent choice (LGPD)
app.post('/api/cookie-consents', async (req, res) => {
  try {
    const { id, choices } = req.body || {};
    if (!id || !choices || typeof choices !== 'object') {
      return res.status(400).json({ error: 'id and choices are required' });
    }
    const normalized = {
      necessary: true,
      analytics: Boolean(choices.analytics),
      marketing: Boolean(choices.marketing)
    };
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 400);
    await saveCookieConsent(String(id), normalized, userAgent);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5f-7. List cookie consent records (admin)
app.get('/api/cookie-consents', async (req, res) => {
  try {
    const records = await listCookieConsents();
    res.json(records);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- BLOG ---

// List all blog posts
app.get('/api/blog/posts', async (req, res) => {
  try {
    res.json(await listBlogPosts());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create or update a blog post (admin)
app.post('/api/blog/posts', async (req, res) => {
  try {
    const post = req.body;
    if (!post || !post.slug || !post.title) {
      return res.status(400).json({ error: 'slug and title are required' });
    }
    const categories = Array.isArray(post.categories)
      ? post.categories.map((c: any) => String(c).trim()).filter(Boolean)
      : (post.category ? [String(post.category).trim()] : []);
    const content = Array.isArray(post.content)
      ? post.content.map((p: any) => `<p>${String(p)}</p>`).join('')
      : String(post.content || '');
    const saved = await saveBlogPost({
      slug: String(post.slug),
      title: String(post.title),
      description: String(post.description || ''),
      content,
      categories,
      image: String(post.image || ''),
      author: String(post.author || ''),
      date: String(post.date || ''),
      readTime: String(post.readTime || ''),
      tags: Array.isArray(post.tags) ? post.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
    }, post.publishedAt);
    res.json({ success: true, post: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a blog post (admin)
app.delete('/api/blog/posts/:slug', async (req, res) => {
  try {
    await deleteBlogPost(req.params.slug);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// List comments. ?slug=... approved-only (public); ?all=1 returns every comment (admin)
app.get('/api/blog/comments', async (req, res) => {
  try {
    if (req.query.all === '1') {
      return res.json(await listAllComments());
    }
    const slug = String(req.query.slug || '');
    if (!slug) return res.status(400).json({ error: 'slug is required' });
    res.json(await listComments(slug, true));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Add a comment (public). Stored as 'pending' so an admin always approves it
// before it appears. Protected by reCAPTCHA v3, an antispam rate limit, and
// URL stripping on the submitted text.
app.post('/api/blog/comments', async (req, res) => {
  try {
    const { postSlug, author, email, content, recaptchaToken } = req.body || {};
    if (!postSlug || !author || !content) {
      return res.status(400).json({ error: 'postSlug, author and content are required' });
    }
    const rate = await checkSubmissionRate(req.ip || '');
    if (!rate.allowed) {
      return res.status(429).json({ error: rateLimitMessage(rate.reason, rate.retryAfterSeconds), reason: rate.reason });
    }
    const verification = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!verification.ok) {
      return res.status(400).json({ error: 'Falha na verificação de segurança. Tente novamente.' });
    }
    const safeAuthor = stripLinks(String(author)).slice(0, 120);
    const safeContent = stripLinks(String(content)).slice(0, 5000);
    if (!safeContent.trim()) {
      return res.status(400).json({ error: 'O comentário não pode ficar vazio.' });
    }
    const id = `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const comment = await addComment(id, String(postSlug), safeAuthor, String(email || ''), safeContent, 'pending');
    res.json({ success: true, pending: true, comment });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update a comment status (admin): approved | hidden
app.put('/api/blog/comments/:id', async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['approved', 'hidden', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    await updateCommentStatus(req.params.id, status);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a comment (admin)
app.delete('/api/blog/comments/:id', async (req, res) => {
  try {
    await deleteComment(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Blog categories
app.get('/api/blog/categories', async (req, res) => {
  try {
    res.json(await listBlogCategories());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/blog/categories', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    await addBlogCategory(name);
    res.json({ success: true, categories: await listBlogCategories() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.delete('/api/blog/categories/:name', async (req, res) => {
  try {
    await deleteBlogCategory(req.params.name);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Blog tags
app.get('/api/blog/tags', async (req, res) => {
  try {
    res.json(await listBlogTags());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.delete('/api/blog/tags/:name', async (req, res) => {
  try {
    await deleteBlogTag(req.params.name);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- TESTIMONIALS (home reviews) ---

// List testimonials. Public returns approved only; admin (?all=1) returns all.
app.get('/api/testimonials', async (req, res) => {
  try {
    const all = req.query.all === '1';
    res.json(await listTestimonials(!all));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Submit a testimonial (public). Stored as 'pending' until an admin approves it.
// Protected by reCAPTCHA v3 if configured.
app.post('/api/testimonials', async (req, res) => {
  try {
    const { name, role, rating, text, platformUsed, recaptchaToken } = req.body || {};
    if (!name || !text) {
      return res.status(400).json({ error: 'Nome e depoimento são obrigatórios.' });
    }
    const rate = await checkSubmissionRate(req.ip || '');
    if (!rate.allowed) {
      return res.status(429).json({ error: rateLimitMessage(rate.reason, rate.retryAfterSeconds), reason: rate.reason });
    }
    const verification = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!verification.ok) {
      return res.status(400).json({ error: 'Falha na verificação de segurança. Tente novamente.' });
    }
    const safeName = stripLinks(String(name)).slice(0, 120);
    const safeRole = stripLinks(String(role || '')).slice(0, 120);
    const safeText = stripLinks(String(text)).slice(0, 2000);
    if (!safeText.trim()) {
      return res.status(400).json({ error: 'O depoimento não pode ficar vazio.' });
    }
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const created = await addTestimonial(
      id,
      { name: safeName, role: safeRole, rating, text: safeText, platformUsed, verified: true, date: 'Agora mesmo' },
      'pending'
    );
    res.json({ success: true, testimonial: created });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create or update a testimonial (admin). Defaults to approved.
app.post('/api/testimonials/save', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.text) {
      return res.status(400).json({ error: 'name and text are required' });
    }
    const id = body.id || `t_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const status = ['approved', 'pending', 'hidden'].includes(body.status) ? body.status : 'approved';
    const saved = await saveTestimonial(id, body, status);
    res.json({ success: true, testimonial: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update a testimonial status (admin): approved | hidden | pending
app.put('/api/testimonials/:id', async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['approved', 'hidden', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    await updateTestimonialStatus(req.params.id, status);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a testimonial (admin)
app.delete('/api/testimonials/:id', async (req, res) => {
  try {
    await deleteTestimonial(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Blocked IPs (antispam) ---
// List permanently blocked IPs (admin).
app.get('/api/blocked-ips', async (req, res) => {
  try {
    res.json(await listBlockedIps());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Lift a permanent block (admin).
app.delete('/api/blocked-ips/:ip', async (req, res) => {
  try {
    await unblockIp(req.params.ip);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public config exposed to the frontend (no secrets) — e.g. the reCAPTCHA site key.
app.get('/api/public-config', async (req, res) => {
  try {
    const integ = await getIntegrations();
    res.json({ recaptchaSiteKey: integ.recaptchaSiteKey || '' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5g. Get integration settings (payment gateway + SMM panel)
// NOTE: these values include secret API keys. The admin panel is the only
// intended consumer; protect this route once real admin auth is in place.
app.get('/api/integrations', async (req, res) => {
  try {
    const integrations = await getIntegrations();
    res.json(integrations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5h. Update integration settings
app.put('/api/integrations', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid integrations object' });
    }
    const saved = await saveIntegrations(body);
    res.json({ success: true, integrations: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5i. Get custom JS / Analytics code snippets.
// The code here is injected verbatim into public pages (Analytics, AdSense,
// Tag Manager, pixels), so it is inherently public — no secrets live here.
app.get('/api/analytics', async (req, res) => {
  try {
    res.json(await getAnalyticsSettings());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5j. Update custom JS / Analytics code snippets (admin).
app.put('/api/analytics', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid analytics settings object' });
    }
    const saved = await saveAnalyticsSettings(body);
    res.json({ success: true, analytics: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- SEO: sitemap.xml & robots.txt ---

// Resolve the public base URL from the incoming request (works behind Railway's
// proxy, which sets x-forwarded-proto/host).
function publicBaseUrl(req: any): string {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers['host'] || '').trim();
  return `${proto}://${host}`;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = publicBaseUrl(req);
    const [posts, categories] = await Promise.all([listBlogPosts(), listBlogCategories()]);
    const urls: string[] = [];
    const push = (loc: string, lastmod?: string, changefreq?: string, priority?: string) => {
      urls.push(
        `  <url>\n    <loc>${xmlEscape(base + loc)}</loc>` +
        (lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '') +
        (changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : '') +
        (priority ? `\n    <priority>${priority}</priority>` : '') +
        `\n  </url>`
      );
    };

    // Static, indexable pages.
    push('/', undefined, 'weekly', '1.0');
    push('/blog', undefined, 'daily', '0.8');
    // Article pages.
    for (const p of posts) {
      const lastmod = p.publishedAt ? p.publishedAt.slice(0, 10) : undefined;
      push(`/blog/artigo/${p.slug}`, lastmod, 'monthly', '0.7');
    }
    // Category pages.
    for (const c of categories) {
      push(`/blog/categoria/${encodeURIComponent(c)}`, undefined, 'weekly', '0.5');
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join('\n') +
      `\n</urlset>\n`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (e: any) {
    res.status(500).send(`<!-- sitemap error: ${e.message} -->`);
  }
});

app.get('/robots.txt', (req, res) => {
  const base = publicBaseUrl(req);
  const body =
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /dashboard\n` +
    `Disallow: /login\n` +
    `Disallow: /api/\n\n` +
    `Sitemap: ${base}/sitemap.xml\n`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(body);
});

// 6. Post new order checkout
app.post('/api/orders', async (req, res) => {
  try {
    const orderDetails = req.body;
    if (!orderDetails.username || !orderDetails.price) {
      return res.status(400).json({ error: 'Username and price are required' });
    }
    const db = await readDB();
    const newOrder = {
      ...orderDetails,
      id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString()
    };
    db.orders = [newOrder, ...db.orders];

    // Auto-create/update user inside the database on purchase
    const email = orderDetails.email || '';
    const username = orderDetails.username || '';
    const phone = orderDetails.phone || '';
    const price = Number(orderDetails.price) || 0;

    let existingUser = db.users.find(u =>
      (email && u.email.toLowerCase() === email.toLowerCase()) ||
      (username && u.username.toLowerCase() === username.toLowerCase())
    );

    if (existingUser) {
      existingUser.ordersCount = (existingUser.ordersCount || 0) + 1;
      existingUser.totalSpent = Number(((existingUser.totalSpent || 0) + price).toFixed(2));
      if (phone && !existingUser.phone) existingUser.phone = phone;
    } else {
      const newUser: UserItem = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        username: username,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString(),
        ordersCount: 1,
        totalSpent: Number(price.toFixed(2)),
        status: 'Ativo'
      };
      db.users.push(newUser);
    }

    await writeDB(db);
    res.json({ success: true, order: newOrder, users: db.users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Toggle order status or update orders list
app.put('/api/orders', async (req, res) => {
  try {
    const updatedOrders = req.body;
    if (!Array.isArray(updatedOrders)) {
      return res.status(400).json({ error: 'Body must be an array of orders' });
    }
    const db = await readDB();
    db.orders = updatedOrders;
    await writeDB(db);
    res.json({ success: true, orders: db.orders });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Reset database
app.post('/api/reset', async (req, res) => {
  try {
    const defaultData = getDefaultData();
    await writeDB(defaultData);
    res.json({ success: true, ...defaultData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- VITE DEV MIDDLEWARE / STATIC FILES ---
async function mountFrontend() {
  // Production (serving the compiled "dist" bundle) is the default. The Vite dev
  // server is only mounted when explicitly running in development (npm run dev),
  // so deployments — e.g. Railway — work without setting any extra variable.
  if (process.env.NODE_ENV === 'development') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite development server middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving compiled production assets from "dist".');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server run securely on port ${PORT}`);
  });
}

// Ensure the database schema exists (and is seeded) before serving traffic.
initDB()
  .then(initRateLimiter)
  .then(mountFrontend)
  .catch((error) => {
    console.error('Failed to initialize PostgreSQL database:', error);
    process.exit(1);
  });
