/**
 * Backend Principal - Anime Mining Telegram Mini App
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const KeepAlive = require('./keep-alive');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Claim Mining Reward
app.post('/claim', async (req, res) => {
  try {
    const { userId, rate } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId requerido' 
      });
    }

    if (!rate || rate < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'rate invalido' 
      });
    }

    const claimed = Math.max(rate * 1, 0.01);
    const newBalance = claimed;

    res.json({
      success: true,
      claimed: Number(claimed.toFixed(4)),
      newBalance: Number(newBalance.toFixed(2)),
      lastClaim: Date.now()
    });
  } catch (error) {
    console.error('Error en /claim:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al procesar claim' 
    });
  }
});

// Get User Data
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    res.json({
      success: true,
      user: {
        userId,
        balance: 0,
        breathLevel: 1,
        energy: 100,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error en /user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener usuario' 
    });
  }
});

// Get Status
app.get('/status', (req, res) => {
  res.json({
    success: true,
    keepAlive: keepAliveService?.getStatus() || { isActive: false },
    server: {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Keep-Alive Setup
let keepAliveService = null;

if (process.env.KEEP_ALIVE_ENABLED === 'true') {
  const intervalMinutes = parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES) || 5;
  keepAliveService = new KeepAlive(process.env.BACKEND_URL, intervalMinutes);
  keepAliveService.start();
}

// Server Start
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Anime Mining Backend iniciado`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔄 Keep-Alive: ${process.env.KEEP_ALIVE_ENABLED === 'true' ? '✅ Activo' : '❌ Desactivo'}`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  if (keepAliveService) keepAliveService.stop();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;