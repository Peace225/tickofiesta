import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';

// Configuration des variables d'environnement
dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

/**
 * 🛰️ INITIALISATION SOCKET.IO
 * Pour les mises à jour en temps réel (Votes TickoFiesta, Alertes Ventes)
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Injection de l'instance IO dans l'application pour accès via req.app.get('io')
app.set('io', io);

/**
 * 🔌 GESTION DES CONNEXIONS TEMPS RÉEL
 */
io.on('connection', (socket) => {
  console.log(`✨ Socket connecté : ${socket.id}`);

  // Rejoindre la "Room" d'un événement spécifique pour les scores en direct
  socket.on('join_event', (event_id) => {
    socket.join(`event_${event_id}`);
    console.log(`🎫 Client ${socket.id} suit l'événement : ${event_id}`);
  });

  // Quitter le suivi d'un événement
  socket.on('leave_event', (event_id) => {
    socket.leave(`event_${event_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`👋 Socket déconnecté : ${socket.id}`);
  });
});

/**
 * 🚀 LANCEMENT DU SERVEUR
 */
server.listen(PORT, () => {
  console.log('-------------------------------------------------------');
  console.log(`🚀 TICKOFIESTA BACKEND : MODE ${process.env.NODE_ENV?.toUpperCase()}`);
  console.log(`📡 SERVEUR ÉCOUTE SUR : http://localhost:${PORT}`);
  console.log('-------------------------------------------------------');
});

/**
 * 🛡️ SÉCURITÉ ET GESTION DES CRASHES
 */
process.on('unhandledRejection', (err) => {
  console.error(`💥 Erreur fatale (Rejection) : ${err.message}`);
  // Fermeture propre pour éviter les fuites de mémoire
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu. Fermeture propre du serveur.');
  server.close(() => process.exit(0));
});