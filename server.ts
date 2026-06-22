import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Since we may bundle this, we can import initial data directly from src/data
import { SERVICES, PREBUILT_PLANS } from './src/data';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'database.json');

app.use(express.json());

// Initialize database file
interface UserItem {
  id: string;
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Ativo' | 'Bloqueado';
}

interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  alertBannerText: string;
  companyWhatsApp: string;
  companyEmail: string;
}

interface DBStructure {
  services: typeof SERVICES;
  plans: typeof PREBUILT_PLANS;
  orders: any[];
  users: UserItem[];
  homeContent: HomeContent;
}

const SEED_ORDERS = [
  {
    id: "TRX-824195",
    username: "@juliana.vasconcelos",
    platform: "instagram",
    serviceLabel: "Seguidores Brasileiros",
    quantity: 2000,
    price: 49.90,
    paymentMethod: "Card",
    email: "juliana.vasc@gmail.com",
    phone: "(11) 98765-4321",
    date: "2026-06-01T10:15:30Z",
    status: "Entregue"
  },
  {
    id: "TRX-412781",
    username: "@burguer_gourmet_br",
    platform: "instagram",
    serviceLabel: "Curtidas Premium",
    quantity: 500,
    price: 19.90,
    paymentMethod: "PIX",
    email: "renan_burguer@outlook.com",
    phone: "(21) 91234-5678",
    date: "2026-06-01T12:05:00Z",
    status: "Entregue"
  },
  {
    id: "TRX-918234",
    username: "@gamer_becker_tt",
    platform: "tiktok",
    serviceLabel: "Seguidores TikTok",
    quantity: 5000,
    price: 119.90,
    paymentMethod: "PIX",
    email: "leticia.becker@gamer.com",
    phone: "(47) 99888-7777",
    date: "2026-06-01T14:10:12Z",
    status: "Aprovado"
  }
];

const SEED_USERS: UserItem[] = [
  {
    id: "USR-001",
    username: "@juliana.vasconcelos",
    email: "juliana.vasc@gmail.com",
    phone: "(11) 98765-4321",
    createdAt: "2026-06-01T10:10:00Z",
    ordersCount: 1,
    totalSpent: 49.90,
    status: "Ativo"
  },
  {
    id: "USR-002",
    username: "@burguer_gourmet_br",
    email: "renan_burguer@outlook.com",
    phone: "(21) 91234-5678",
    createdAt: "2026-06-01T12:00:00Z",
    ordersCount: 1,
    totalSpent: 19.90,
    status: "Ativo"
  },
  {
    id: "USR-003",
    username: "@gamer_becker_tt",
    email: "leticia.becker@gamer.com",
    phone: "(47) 99888-7777",
    createdAt: "2026-06-01T14:05:00Z",
    ordersCount: 1,
    totalSpent: 119.90,
    status: "Ativo"
  }
];

const DEFAULT_HOME_CONTENT: HomeContent = {
  heroTitle: "Impulsione Suas Redes Sociais com Seguidores Reais",
  heroSubtitle: "Aumente sua autoridade, alcance orgânico e vendas com nossa entrega natural e segura. Resultados garantidos em minutos.",
  alertBannerText: "OFERTA RELÂMPAGO DE INVERNO: 20% OFF EXTRA NO PIX",
  companyWhatsApp: "5511999999999",
  companyEmail: "suporte@impulsionegram.com"
};

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Upgrade existing database schemas if users/homeContent is missing
      let modified = false;
      if (!parsed.users) {
        parsed.users = SEED_USERS;
        modified = true;
      }
      if (!parsed.homeContent) {
        parsed.homeContent = DEFAULT_HOME_CONTENT;
        modified = true;
      }
      if (modified) {
        writeDB(parsed);
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error reading database file, using fallback:', error);
  }

  // Create default fallback structure
  const initialData: DBStructure = {
    services: SERVICES,
    plans: PREBUILT_PLANS,
    orders: SEED_ORDERS,
    users: SEED_USERS,
    homeContent: DEFAULT_HOME_CONTENT
  };
  writeDB(initialData);
  return initialData;
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

// Ensure database file is generated at startup
readDB();

// --- API ROUTES ---

// 1. Get current services list
app.get('/api/services', (req, res) => {
  const db = readDB();
  res.json(db.services);
});

// 2. Update service catalog
app.put('/api/services', (req, res) => {
  try {
    const updatedServices = req.body;
    if (!Array.isArray(updatedServices)) {
      return res.status(400).json({ error: 'Body must be an array of services' });
    }
    const db = readDB();
    db.services = updatedServices;
    writeDB(db);
    res.json({ success: true, services: db.services });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Get fast prebuilt plans
app.get('/api/plans', (req, res) => {
  const db = readDB();
  res.json(db.plans);
});

// 4. Update plans catalog
app.put('/api/plans', (req, res) => {
  try {
    const updatedPlans = req.body;
    if (!Array.isArray(updatedPlans)) {
      return res.status(400).json({ error: 'Body must be an array of plans' });
    }
    const db = readDB();
    db.plans = updatedPlans;
    writeDB(db);
    res.json({ success: true, plans: db.plans });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Get recent orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// 5b. Get users list
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

// 5c. Update users list (block/unblock or delete)
app.put('/api/users', (req, res) => {
  try {
    const updatedUsers = req.body;
    if (!Array.isArray(updatedUsers)) {
      return res.status(400).json({ error: 'Body must be an array of users' });
    }
    const db = readDB();
    db.users = updatedUsers;
    writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5d. Get general home content
app.get('/api/home', (req, res) => {
  const db = readDB();
  res.json(db.homeContent || DEFAULT_HOME_CONTENT);
});

// 5e. Update general home content
app.put('/api/home', (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ error: 'Body must be a valid home content object' });
    }
    const db = readDB();
    db.homeContent = { ...DEFAULT_HOME_CONTENT, ...newContent };
    writeDB(db);
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

// 6. Post new order checkout
app.post('/api/orders', (req, res) => {
  try {
    const orderDetails = req.body;
    if (!orderDetails.username || !orderDetails.price) {
      return res.status(400).json({ error: 'Username and price are required' });
    }
    const db = readDB();
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
    
    writeDB(db);
    res.json({ success: true, order: newOrder, users: db.users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Toggle order status or update orders list
app.put('/api/orders', (req, res) => {
  try {
    const updatedOrders = req.body;
    if (!Array.isArray(updatedOrders)) {
      return res.status(400).json({ error: 'Body must be an array of orders' });
    }
    const db = readDB();
    db.orders = updatedOrders;
    writeDB(db);
    res.json({ success: true, orders: db.orders });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Reset database
app.post('/api/reset', (req, res) => {
  try {
    const defaultData: DBStructure = {
      services: SERVICES,
      plans: PREBUILT_PLANS,
      orders: SEED_ORDERS,
      users: SEED_USERS,
      homeContent: DEFAULT_HOME_CONTENT
    };
    writeDB(defaultData);
    res.json({ success: true, ...defaultData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- VITE DEV MIDDLEWARE / STATIC FILES ---
async function mountFrontend() {
  if (process.env.NODE_ENV !== 'production') {
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

mountFrontend();
