import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware.js';

// --- IMPORT DES ROUTES ---
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import eventRoutes from './routes/event.routes.js';
import voteRoutes from './routes/vote.routes.js';
import promoRoutes from './routes/promo.routes.js';

const app = express();

// --- 1. SÉCURITÉ & CORS (FIXÉ) ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permet le chargement d'images/assets cross-origin
}));

// Configuration CORS XXL pour accepter tes deux environnements de dev
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean); // Supprime les valeurs undefined si CLIENT_URL n'est pas défini

app.use(cors({
  origin: function (origin, callback) {
    // Permet les requêtes sans origine (comme Postman) ou celles dans la liste blanche
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqué par la politique CORS de TickoFiesta'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 2. LOGIQUE WEBHOOK (AVANT express.json) ---
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// --- 3. PARSING & LOGS ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- 4. RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { success: false, message: 'Trop de requêtes, réessayez dans 15 minutes' },
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api', limiter);

// --- 5. ROUTES API ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/promo', promoRoutes);

// --- 6. ROUTES SYSTÈME ---
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'TickoFiesta Payment Bridge Opérationnel 🚀',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable sur le serveur' });
});

app.use(errorHandler);

export default app;