import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = app.listen(PORT, () => {
  console.log(`[Backend] Express server listening on http://localhost:${PORT}`);
  console.log(`[Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Backend] Configured Client Origin: ${CLIENT_URL}`);
  console.log(`[Backend] Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Backend] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Backend] HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('[Backend] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[Backend] HTTP server closed');
  });
});

export default server;
