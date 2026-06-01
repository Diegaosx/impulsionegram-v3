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
interface DBStructure {
  services: typeof SERVICES;
  plans: typeof PREBUILT_PLANS;
  orders: any[];
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

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading database file, using fallback:', error);
  }

  // Create default fallback structure
  const initialData: DBStructure = {
    services: SERVICES,
    plans: PREBUILT_PLANS,
    orders: SEED_ORDERS
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
    writeDB(db);
    res.json({ success: true, order: newOrder });
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
      orders: SEED_ORDERS
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
