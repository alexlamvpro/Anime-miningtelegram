/**
 * Keep-Alive Module para Anime Mining Backend
 * Mantiene el servidor despierto y evita que se duerma en plataformas como Render
 */

const axios = require('axios');

class KeepAlive {
  constructor(baseUrl, intervalMinutes = 5) {
    this.baseUrl = baseUrl;
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.isActive = false;
    this.lastPingTime = null;
  }

  start() {
    if (this.isActive) {
      console.warn('⚠️  Keep-Alive ya está activo');
      return;
    }

    this.isActive = true;
    console.log(`✅ Keep-Alive iniciado - Ping cada ${this.intervalMs / 60000} minutos`);

    this.interval = setInterval(() => {
      this.sendPing();
    }, this.intervalMs);

    this.sendPing();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isActive = false;
      console.log('❌ Keep-Alive detenido');
    }
  }

  async sendPing() {
    try {
      const timestamp = new Date().toISOString();
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Anime-Mining-KeepAlive/1.0'
        }
      });

      this.lastPingTime = new Date();
      console.log(`🟢 [${timestamp}] Keep-Alive Ping exitoso - Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error(`🔴 [${new Date().toISOString()}] Keep-Alive Ping fallido:`, error.message);
      return false;
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      lastPingTime: this.lastPingTime,
      intervalMinutes: this.intervalMs / 60000,
      uptime: process.uptime()
    };
  }
}

module.exports = KeepAlive;