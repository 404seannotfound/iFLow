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

// Create test data
router.post('/test-data', async (req, res) => {
  try {
    console.log('🎭 Creating test data...');

    // Create 4 test users
    const users = [];
    const usernames = ['alice', 'bob', 'charlie', 'diana'];
    const displayNames = ['Alice Flow', 'Bob Spinner', 'Charlie Poi', 'Diana Hoop'];
    
    for (let i = 0; i < 4; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const result = await query(
        `INSERT INTO users (username, email, password_hash, display_name, bio)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username`,
        [
          usernames[i],
          `${usernames[i]}@example.com`,
          hashedPassword,
          displayNames[i],
          `Flow artist and ${['poi', 'staff', 'hoop', 'fan'][i]} enthusiast`
        ]
      );
      users.push(result.rows[0]);
    }

    // Create 2 hubs
    const sfHub = await query(
      `INSERT INTO hubs (name, description, location, latitude, longitude, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'San Francisco Flow Arts',
        'Bay Area flow artists community - poi, staff, hoop, and more!',
        'San Francisco, CA',
        37.7749,
        -122.4194,
        users[0].id
      ]
    );

    const canaryHub = await query(
      `INSERT INTO hubs (name, description, location, latitude, longitude, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'Canary Islands Flow Community',
        'Island paradise flow arts - beach sessions and fire spinning!',
        'Tenerife, Canary Islands',
        28.2916,
        -16.6291,
        users[1].id
      ]
    );

    // Add members to hubs
    for (const user of users) {
      await query(
        `INSERT INTO hub_members (hub_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [sfHub.rows[0].id, user.id, 'member']
      );
      await query(
        `INSERT INTO hub_members (hub_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [canaryHub.rows[0].id, user.id, 'member']
      );
    }

    // Create events
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(18, 0, 0, 0); // 6 PM tonight
    
    // Thanksgiving dinner in Leavenworth, WA (tonight 6-8:30 PM PST)
    await query(
      `INSERT INTO events (user_id, hub_id, title, description, location, latitude, longitude, start_time, end_time, max_participants, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        users[0].id,
        sfHub.rows[0].id,
        'Thanksgiving Flow Dinner',
        'Join us for a potluck Thanksgiving dinner followed by evening flow session!',
        'Leavenworth, WA',
        47.5962,
        -120.6615,
        tonight.toISOString(),
        new Date(tonight.getTime() + 2.5 * 60 * 60 * 1000).toISOString(), // 8:30 PM
        30,
        'scheduled'
      ]
    );

    // SF event tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    await query(
      `INSERT INTO events (user_id, hub_id, title, description, location, latitude, longitude, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        users[1].id,
        sfHub.rows[0].id,
        'Golden Gate Park Flow Jam',
        'Weekly flow jam at the polo fields. Bring your props and good vibes!',
        'Golden Gate Park, San Francisco',
        37.7694,
        -122.4862,
        tomorrow.toISOString(),
        new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        'scheduled'
      ]
    );

    // Canary Islands events over next 4 days
    for (let i = 0; i < 3; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + i + 1);
      eventDate.setHours(20, 0, 0, 0); // 8 PM local time
      
      const titles = [
        'Beach Sunset Flow Session',
        'Fire Spinning Workshop',
        'Full Moon Flow Gathering'
      ];
      const descriptions = [
        'Meet at Playa de las Teresitas for sunset flow and beach vibes',
        'Learn fire safety and basic fire poi techniques. Bring your own props!',
        'Celebrate the full moon with flow, music, and community'
      ];
      
      await query(
        `INSERT INTO events (user_id, hub_id, title, description, location, latitude, longitude, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          users[i % 4].id,
          canaryHub.rows[0].id,
          titles[i],
          descriptions[i],
          'Tenerife, Canary Islands',
          28.2916 + (Math.random() - 0.5) * 0.1,
          -16.6291 + (Math.random() - 0.5) * 0.1,
          eventDate.toISOString(),
          new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          'scheduled'
        ]
      );
    }

    // Create posts in hubs (mix of public and private)
    const postContents = [
      { text: 'Just got my new LED poi! Can\'t wait to try them out tonight 🔥', public: true },
      { text: 'Anyone want to practice together this weekend?', public: true },
      { text: 'Check out this new trick I learned! [private session notes]', public: false },
      { text: 'The sunset session yesterday was amazing! Thanks everyone who came', public: true },
      { text: 'Looking for recommendations on fire poi for beginners', public: true },
      { text: 'Private: Working on a new routine for the competition', public: false },
      { text: 'Beach flow sessions are the best! Who else loves flowing by the ocean?', public: true },
      { text: 'Just ordered some new props from FlowToys!', public: true }
    ];

    for (let i = 0; i < postContents.length; i++) {
      const hubId = i % 2 === 0 ? sfHub.rows[0].id : canaryHub.rows[0].id;
      await query(
        `INSERT INTO posts (user_id, hub_id, content, is_public)
         VALUES ($1, $2, $3, $4)`,
        [users[i % 4].id, hubId, postContents[i].text, postContents[i].public]
      );
    }

    // Create marketplace listings
    const listings = [
      {
        title: 'LED Contact Poi - Like New',
        description: 'Barely used LED contact poi, perfect condition. Includes charger and carrying case.',
        price: 120.00,
        condition: 'like_new',
        location: 'San Francisco, CA'
      },
      {
        title: 'Fire Staff - 5ft',
        description: 'Professional fire staff, 5 feet long. Great for beginners and intermediate spinners.',
        price: 75.00,
        condition: 'good',
        location: 'Tenerife, Canary Islands'
      },
      {
        title: 'Hula Hoop Set (3 hoops)',
        description: 'Set of 3 polypro hoops in different sizes. Perfect for practicing or teaching.',
        price: 45.00,
        condition: 'good',
        location: 'San Francisco, CA'
      },
      {
        title: 'Sock Poi - Handmade',
        description: 'Hand-sewn sock poi, great for practice. Set of 2.',
        price: 15.00,
        condition: 'new',
        location: 'Tenerife, Canary Islands'
      }
    ];

    const listingIds = [];
    for (let i = 0; i < listings.length; i++) {
      const result = await query(
        `INSERT INTO marketplace_listings (user_id, hub_id, title, description, price, condition, location, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          users[i % 4].id,
          i % 2 === 0 ? sfHub.rows[0].id : canaryHub.rows[0].id,
          listings[i].title,
          listings[i].description,
          listings[i].price,
          listings[i].condition,
          listings[i].location,
          'active'
        ]
      );
      listingIds.push(result.rows[0].id);
    }

    // Add comments to marketplace listings
    const comments = [
      'Is this still available?',
      'Would you ship to the mainland?',
      'Great price! I\'m interested',
      'Do you have any videos of these in action?',
      'I\'ll take them! Can we meet this weekend?'
    ];

    for (let i = 0; i < listingIds.length; i++) {
      // Add 1-2 comments per listing
      const numComments = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numComments; j++) {
        await query(
          `INSERT INTO listing_comments (listing_id, user_id, content)
           VALUES ($1, $2, $3)`,
          [listingIds[i], users[(i + j + 1) % 4].id, comments[(i + j) % comments.length]]
        );
      }
    }

    console.log('✅ Test data created successfully!');
    res.json({
      success: true,
      message: 'Test data created',
      summary: {
        users: users.length,
        hubs: 2,
        events: 5,
        posts: postContents.length,
        listings: listings.length
      }
    });

  } catch (error) {
    console.error('❌ Test data creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
