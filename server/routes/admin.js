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

      // Get activity metrics over time
      const metrics = {};

      // Users created over last 30 days
      if (stats.tables.includes('users')) {
        const usersOverTime = await query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM users
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `);
        metrics.usersOverTime = usersOverTime.rows;
      }

      // Events created over last 30 days
      if (stats.tables.includes('events')) {
        const eventsOverTime = await query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM events
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `);
        metrics.eventsOverTime = eventsOverTime.rows;
      }

      // Videos uploaded over last 30 days
      if (stats.tables.includes('videos')) {
        const videosOverTime = await query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM videos
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `);
        metrics.videosOverTime = videosOverTime.rows;
      }

      // Posts created over last 30 days
      if (stats.tables.includes('posts')) {
        const postsOverTime = await query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM posts
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `);
        metrics.postsOverTime = postsOverTime.rows;
      }

      // Most active users (by posts + videos)
      if (stats.tables.includes('users') && stats.tables.includes('posts')) {
        const activeUsers = await query(`
          SELECT 
            u.username,
            u.display_name,
            COUNT(DISTINCT p.id) as post_count,
            COUNT(DISTINCT v.id) as video_count,
            COUNT(DISTINCT p.id) + COUNT(DISTINCT v.id) as total_activity
          FROM users u
          LEFT JOIN posts p ON u.id = p.user_id
          LEFT JOIN videos v ON u.id = v.user_id
          GROUP BY u.id, u.username, u.display_name
          HAVING COUNT(DISTINCT p.id) + COUNT(DISTINCT v.id) > 0
          ORDER BY total_activity DESC
          LIMIT 10
        `);
        metrics.activeUsers = activeUsers.rows;
      }

      // Most popular hubs (by member count)
      if (stats.tables.includes('hubs') && stats.tables.includes('hub_members')) {
        const popularHubs = await query(`
          SELECT 
            h.name,
            h.location,
            COUNT(hm.user_id) as member_count
          FROM hubs h
          LEFT JOIN hub_members hm ON h.id = hm.hub_id
          GROUP BY h.id, h.name, h.location
          ORDER BY member_count DESC
          LIMIT 10
        `);
        metrics.popularHubs = popularHubs.rows;
      }

      // Recent activity summary (last 7 days)
      const recentActivity = {};
      if (stats.tables.includes('users')) {
        const newUsers = await query(`
          SELECT COUNT(*) as count FROM users 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        recentActivity.newUsers = parseInt(newUsers.rows[0].count);
      }
      if (stats.tables.includes('events')) {
        const newEvents = await query(`
          SELECT COUNT(*) as count FROM events 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        recentActivity.newEvents = parseInt(newEvents.rows[0].count);
      }
      if (stats.tables.includes('videos')) {
        const newVideos = await query(`
          SELECT COUNT(*) as count FROM videos 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        recentActivity.newVideos = parseInt(newVideos.rows[0].count);
      }
      if (stats.tables.includes('posts')) {
        const newPosts = await query(`
          SELECT COUNT(*) as count FROM posts 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `);
        recentActivity.newPosts = parseInt(newPosts.rows[0].count);
      }

      metrics.recentActivity = recentActivity;
      stats.metrics = metrics;
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
