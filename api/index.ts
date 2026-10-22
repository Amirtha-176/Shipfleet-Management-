import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import apiRouter, { setBroadcastFunction } from '../src/server/routes.ts';

const app = express();

// Dummy broadcast function for serverless environment
setBroadcastFunction(() => {});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'FleetOps Maritime ShipFleet Platform (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
});

// Main API routes
app.use('/api', apiRouter);

export default app;
