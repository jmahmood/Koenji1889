import { defineConfig } from 'vite';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_PORT = Number(process.env.KOENJI_BACKEND_PORT || 8789);
const BACKEND_TARGET = process.env.DAEMON18XX_URL || `http://127.0.0.1:${BACKEND_PORT}`;

function checkPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function koenjiBackendPlugin() {
  let backendProc = null;

  const ensureBackend = async () => {
    if (process.env.DAEMON18XX_URL) return;
    const isRunning = await checkPortOpen(BACKEND_PORT);
    if (!isRunning && !backendProc) {
      backendProc = spawn('python3', ['server_bridge.py'], {
        cwd: __dirname,
        env: { ...process.env, KOENJI_BACKEND_PORT: String(BACKEND_PORT) },
        stdio: 'inherit',
      });
      backendProc.on('exit', () => {
        backendProc = null;
      });
    }
  };

  return {
    name: 'koenji-1889-backend-autostart',
    async configureServer() {
      await ensureBackend();
    },
    async configurePreviewServer() {
      await ensureBackend();
    },
    closeBundle() {
      if (backendProc) {
        backendProc.kill();
        backendProc = null;
      }
    },
  };
}

export default defineConfig({
  plugins: [koenjiBackendPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/health': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      '/health': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
    },
  },
});
