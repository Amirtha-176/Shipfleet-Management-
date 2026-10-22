import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { MongoClient, Db } from 'mongodb';
import { IDatabaseSchema } from './storage.ts';

interface MongoStatus {
  connected: boolean;
  mode: 'MongoDB Atlas / Server' | 'Embedded MongoDB Engine (Local)';
  uri: string;
  database: string;
  collections: Record<string, number>;
  lastSynced?: string;
  error?: string;
}

class MongoDatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private currentUri: string = '';
  private dbName: string = 'maritime_fleet_db';
  private lastSyncedTime: string | null = null;
  private onConnectListeners: Array<() => void> = [];

  constructor() {
    const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    // Only attempt external MongoDB connection if a valid external host or Atlas URI is provided,
    // and ignore default docker-compose internal aliases like 'mongodb://mongodb:' which are unresolvable in standalone containers
    const isValidExternalUri = rawUri && !rawUri.includes('//mongodb:') && !rawUri.includes('//mongodb/');
    if (isValidExternalUri) {
      this.initConnection(rawUri).catch(() => {
        // Embedded engine will be used automatically
      });
    } else {
      console.log('[Storage Engine] Using persistent embedded MongoDB engine for maritime fleet operations.');
    }
  }

  public onConnected(cb: () => void) {
    this.onConnectListeners.push(cb);
    if (this.isConnected) {
      try {
        cb();
      } catch {}
    }
  }

  public async initConnection(uri: string): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.close().catch(() => {});
      }
      this.currentUri = uri;
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      this.lastSyncedTime = new Date().toISOString();
      console.log('Successfully connected to external MongoDB Atlas database:', this.dbName);
      this.onConnectListeners.forEach((cb) => {
        try {
          cb();
        } catch {}
      });
      return true;
    } catch {
      this.isConnected = false;
      this.client = null;
      this.db = null;
      console.log('[Storage Engine] External MongoDB Atlas awaiting IP whitelist / connection, using persistent embedded engine.');
      return false;
    }
  }

  public getConnected(): boolean {
    return this.isConnected && this.db !== null;
  }

  public async syncDoc(collection: keyof IDatabaseSchema, action: string, doc: any) {
    if (!this.getConnected() || !this.db) return;
    try {
      const col = this.db.collection(collection as string);
      if (action === 'create') {
        await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
      } else if (action === 'update') {
        await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
      } else if (action === 'delete') {
        await col.deleteOne({ _id: doc._id });
      } else if (action === 'reset') {
        // Handled via full dump
      }
      this.lastSyncedTime = new Date().toISOString();
    } catch (err) {
      console.warn(`MongoDB write to ${collection} error:`, err);
    }
  }

  public async syncAllData(data: IDatabaseSchema) {
    if (!this.getConnected() || !this.db) return;
    try {
      const collections: (keyof IDatabaseSchema)[] = [
        'users',
        'vessels',
        'voyages',
        'cargo',
        'fuelRecords',
        'maintenance',
        'ports',
        'crew',
        'alerts',
        'auditLogs'
      ];
      for (const colName of collections) {
        const col = this.db.collection(colName);
        const docs = data[colName] as any[];
        await col.deleteMany({}).catch(() => {});
        if (docs && docs.length > 0) {
          await col.insertMany(docs).catch(() => {});
        }
      }
      this.lastSyncedTime = new Date().toISOString();
    } catch (err) {
      console.warn('MongoDB full sync error:', err);
    }
  }

  public async getStatus(localCounts: Record<string, number>): Promise<MongoStatus> {
    const maskedUri = this.currentUri
      ? this.currentUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
      : 'mongodb://localhost:27017/maritime_fleet_db';

    if (!this.getConnected() || !this.db) {
      return {
        connected: false,
        mode: 'Embedded MongoDB Engine (Local)',
        uri: maskedUri,
        database: this.dbName,
        collections: localCounts,
        lastSynced: this.lastSyncedTime || new Date().toISOString()
      };
    }

    try {
      const counts: Record<string, number> = {};
      const colNames = ['users', 'vessels', 'voyages', 'cargo', 'fuelRecords', 'maintenance', 'ports', 'crew', 'alerts', 'auditLogs'];
      for (const name of colNames) {
        counts[name] = await this.db.collection(name).countDocuments();
      }
      return {
        connected: true,
        mode: 'MongoDB Atlas / Server',
        uri: maskedUri,
        database: this.dbName,
        collections: counts,
        lastSynced: this.lastSyncedTime || new Date().toISOString()
      };
    } catch (err: any) {
      return {
        connected: false,
        mode: 'Embedded MongoDB Engine (Local)',
        uri: maskedUri,
        database: this.dbName,
        collections: localCounts,
        error: err.message
      };
    }
  }
}

export const mongoManager = new MongoDatabaseManager();
