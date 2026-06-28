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
  deleteBlogTag
} from './db';
import { uploadToR2, isR2Configured } from './r2';

const app = express();
const PORT = 3000;

app.use(express.json());

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
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
      res.json({ success: true, token: 'admin-token-secure-123', message: 'Autenticado com sucesso' });
    } else {
      res.status(401).json({ success: false, error: 'Usuário ou senha incorretos' });
    }
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

// Add a comment (public). Approved by default so it shows immediately; the
// admin can hide or delete it afterwards.
app.post('/api/blog/comments', async (req, res) => {
  try {
    const { postSlug, author, email, content } = req.body || {};
    if (!postSlug || !author || !content) {
      return res.status(400).json({ error: 'postSlug, author and content are required' });
    }
    const id = `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const comment = await addComment(id, String(postSlug), String(author), String(email || ''), String(content), 'approved');
    res.json({ success: true, comment });
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
  .then(mountFrontend)
  .catch((error) => {
    console.error('Failed to initialize PostgreSQL database:', error);
    process.exit(1);
  });
