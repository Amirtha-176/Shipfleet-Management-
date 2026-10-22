import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter, { setBroadcastFunction } from './src/server/routes.ts';
import { db } from './src/server/storage.ts';
import { IVessel } from './src/server/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io on the same HTTP server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Configure broadcast function for API routes
setBroadcastFunction((event: string, payload: unknown) => {
  io.emit(event, payload);
});

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Connection & Presence Handling
interface ConnectedUser {
  socketId: string;
  userId?: string;
  name?: string;
  role?: string;
  email?: string;
  connectedAt: string;
}

const activeSockets = new Map<string, ConnectedUser>();

io.on('connection', (socket) => {
  const userEntry: ConnectedUser = {
    socketId: socket.id,
    connectedAt: new Date().toISOString()
  };
  activeSockets.set(socket.id, userEntry);

  // Send current active user count
  io.emit('presence:update', {
    onlineCount: activeSockets.size,
    users: Array.from(activeSockets.values()).filter((u) => !!u.email)
  });

  socket.on('user:identify', (userData: { id: string; name: string; role: string; email: string }) => {
    if (userData && userData.email) {
      activeSockets.set(socket.id, {
        socketId: socket.id,
        userId: userData.id,
        name: userData.name,
        role: userData.role,
        email: userData.email,
        connectedAt: new Date().toISOString()
      });

      io.emit('presence:update', {
        onlineCount: activeSockets.size,
        users: Array.from(activeSockets.values()).filter((u) => !!u.email)
      });
    }
  });

  socket.on('disconnect', () => {
    activeSockets.delete(socket.id);
    io.emit('presence:update', {
      onlineCount: activeSockets.size,
      users: Array.from(activeSockets.values()).filter((u) => !!u.email)
    });
  });

  // Client requests or changes simulation playback speed
  socket.on('simulation:set_speed', (newSpeed: number) => {
    simulationSpeed = Math.max(0, Math.min(20, Number(newSpeed) || 0));
    io.emit('simulation:speed_change', { speed: simulationSpeed });
  });

  // Emit initial simulation speed
  socket.emit('simulation:speed_change', { speed: simulationSpeed });
});

// Live Vessel Telemetry Simulation with dynamic speed control (1x, 2x, 5x, 10x, or paused)
let simulationSpeed = 1;

export function getSimulationSpeed() {
  return simulationSpeed;
}

export function setSimulationSpeedValue(val: number) {
  simulationSpeed = Math.max(0, Math.min(20, Number(val) || 0));
  io.emit('simulation:speed_change', { speed: simulationSpeed });
  return simulationSpeed;
}

setInterval(() => {
  if (simulationSpeed <= 0) return; // Paused
  try {
    const inTransitVessels = db.find('vessels', (v) => v.status === 'In Transit');
    if (inTransitVessels.length === 0) return;

    for (const vsl of inTransitVessels) {
      // Delta along current heading scaled by user simulation multiplier
      const headingRad = (vsl.currentLocation.heading * Math.PI) / 180;
      const speedOffset = (vsl.currentLocation.speedKnots / 3600) * 0.04 * simulationSpeed;
      const latDelta = Math.cos(headingRad) * speedOffset;
      const lngDelta = Math.sin(headingRad) * speedOffset;

      const newLat = Number((vsl.currentLocation.lat + latDelta).toFixed(4));
      const newLng = Number((vsl.currentLocation.lng + lngDelta).toFixed(4));

      // Speed jitter +/- 0.2 knots
      const speedJitter = Number((vsl.currentLocation.speedKnots + (Math.random() * 0.4 - 0.2)).toFixed(1));
      const clampedSpeed = Math.max(10, Math.min(24, speedJitter));

      const updatedLocation = {
        ...vsl.currentLocation,
        lat: newLat,
        lng: newLng,
        speedKnots: clampedSpeed,
        updatedAt: new Date().toISOString()
      };

      db.findByIdAndUpdate('vessels', vsl._id, { currentLocation: updatedLocation }, false);

      io.emit('vessel:telemetry', {
        vesselId: vsl._id,
        vesselName: vsl.name,
        location: updatedLocation,
        simulationSpeed
      });
    }
  } catch (err) {
    console.error('Telemetry simulation error:', err);
  }
}, 2500);

// API Routes
app.use('/api', apiRouter);

// Database offline error middleware fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || err.message?.includes('buffering timed out'))) {
    console.warn('[AI Studio] Database offline — returning mock empty response');
    if (req.method === 'GET') {
      res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      return;
    }
    res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    return;
  }
  next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'FleetOps Maritime ShipFleet Platform',
    timestamp: new Date().toISOString()
  });
});

// Vite dev server integration or static file serving
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
        watch: {
          ignored: ['**/data/**', '**/data/database.json', '**/.git/**']
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let currentPort = PORT;
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[FleetOps] Port ${currentPort} in use. Automatically starting on port ${currentPort + 1}...`);
      currentPort++;
      setTimeout(() => {
        server.listen(currentPort, '0.0.0.0');
      }, 300);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(currentPort, '0.0.0.0', () => {
    console.log(`[FleetOps Maritime] Server running on:`);
    console.log(`  ➜ Local:   http://localhost:${currentPort}`);
    console.log(`  ➜ Network: http://127.0.0.1:${currentPort}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FleetOps server:', err);
  process.exit(1);
});
