import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    stats.tables = tablesResult.rows.map(r => r.table_name);
    stats.tableCount = stats.tables.length;

    // If tables exist, get counts
    if (stats.tableCount > 0) {
      const counts = {};
      
      const countQueries = [
        'users', 'hubs', 'hub_members', 'events', 'event_rsvps',
        'videos', 'video_likes', 'posts', 'post_likes',
        'marketplace_listings', 'conversations', 'messages',
        'creator_tiers', 'subscriptions', 'notifications'
      ];

      for (const table of countQueries) {
        if (stats.tables.includes(table)) {
          try {
            const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
            counts[table] = parseInt(result.rows[0].count);
          } catch (err) {
            counts[table] = 'error';
          }
        }
      }
      
      stats.counts = counts;
    }

    stats.initialized = stats.tableCount >= 20;
    stats.timestamp = new Date().toISOString();

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: error.message,
      initialized: false,
      tableCount: 0
    });
  }
});

// Initialize database
router.post('/init', async (req, res) => {
  try {
    console.log('🚀 Starting database initialization...');

    // Read and execute schema
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing schema...');
    await query(schema);
    console.log('✅ Schema created');

    // Create default user
    console.log('👤 Creating default user...');
    const passwordHash = await bcrypt.hash('seansean', 10);
    
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, display_name, bio) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, display_name, created_at`,
      ['sean', 'seansp@gmail.com', passwordHash, 'Sean', 'iFlow Admin']
    );

    const user = userResult.rows[0];
    console.log('✅ User created:', user.username);

    res.json({
      success: true,
      message: 'Database initialized successfully',
      user: {
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        id: user.id
      },
      credentials: {
        username: 'sean',
        password: 'seansean',
        email: 'seansp@gmail.com'
      }
    });

  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Reset database (drop all tables)
router.post('/reset', async (req, res) => {
  try {
    console.log('🗑️ Resetting database...');

    // Drop all tables
    await query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('✅ Database reset complete');

    res.json({
      success: true,
      message: 'Database reset successfully. Run init to recreate tables.'
    });

  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

export default router;
