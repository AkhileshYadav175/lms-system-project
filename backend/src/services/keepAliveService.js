import https from 'https';
import http from 'http';
import mongoose from 'mongoose';

export const startKeepAlive = () => {
  // Resolve server URL from Render, Railway, or manual SERVER_URL env
  let serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;

  if (!serverUrl && process.env.RAILWAY_PUBLIC_DOMAIN) {
    serverUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (!serverUrl && process.env.RAILWAY_STATIC_URL) {
    serverUrl = `https://${process.env.RAILWAY_STATIC_URL}`;
  }

  // 1. Keep MongoDB connection pool warm by pinging admin DB every 4 minutes
  const DB_PING_INTERVAL = 4 * 60 * 1000;
  setInterval(async () => {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
    } catch (err) {
      // Silently ignore ping errors
    }
  }, DB_PING_INTERVAL);

  if (!serverUrl) {
    console.log('Keep-alive HTTP ping skipped: No RENDER_EXTERNAL_URL, RAILWAY_PUBLIC_DOMAIN, or SERVER_URL found in env.');
    return;
  }

  // 2. Ping HTTP server every 5 minutes (prevents hosting spin-down/cold starts)
  const pingInterval = 5 * 60 * 1000; 

  setInterval(() => {
    const protocol = serverUrl.startsWith('https') ? https : http;
    
    protocol.get(serverUrl, (res) => {
      // Drain response stream to free sockets
      res.resume();
    }).on('error', (err) => {
      console.error(`Keep-alive ping error: ${err.message}`);
    });
  }, pingInterval);
  
  console.log(`Keep-alive service active: pinging ${serverUrl} and keeping DB pool warm.`);
};
