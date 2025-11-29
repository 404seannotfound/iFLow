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

    // Create 4 test users (neighbors)
    const users = [];
    const usernames = ['susan', 'mike', 'karen', 'dave'];
    const displayNames = ['Susan Miller', 'Mike Johnson', 'Karen Thompson', 'Dave Wilson'];
    
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
          `${['Retired teacher, 15 years on Oak Street', 'IT guy, neighborhood watch captain', 'Real estate agent, HOA board member', 'Contractor, been here since 2010'][i]}`
        ]
      );
      users.push(result.rows[0]);
    }

    // Create 2 neighborhoods
    const oakStreet = await query(
      `INSERT INTO hubs (name, description, location, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'Oak Street Block',
        'The friendliest block in Maplewood! Join us for community events, neighborhood watch updates, and good old-fashioned neighborly chat.',
        'Oak Street, Maplewood',
        40.7282,
        -74.2351,
        users[0].id
      ]
    );

    const pineHills = await query(
      `INSERT INTO hubs (name, description, location, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'Pine Hills Subdivision',
        'Pine Hills HOA community board - stay updated on meetings, events, and community guidelines.',
        'Pine Hills, Maplewood',
        40.7312,
        -74.2401,
        users[2].id
      ]
    );

    // Add members to neighborhoods
    for (const user of users) {
      await query(
        `INSERT INTO hub_members (hub_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [oakStreet.rows[0].id, user.id, 'member']
      );
      await query(
        `INSERT INTO hub_members (hub_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [pineHills.rows[0].id, user.id, 'member']
      );
    }

    // Create events - neighborhood themed with holiday season
    const now = new Date();
    
    // Black Friday Leftovers Potluck (tomorrow)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, max_attendees, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        users[0].id,
        oakStreet.rows[0].id,
        'Post-Thanksgiving Leftovers Potluck',
        'Bring your Turkey Day leftovers! Let\'s share food and Black Friday horror stories. 🦃',
        '123 Oak Street - Susan\'s house',
        tomorrow.toISOString(),
        new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        25,
        'scheduled'
      ]
    );

    // Neighborhood Watch Meeting
    const watchMeeting = new Date(now);
    watchMeeting.setDate(watchMeeting.getDate() + 3);
    watchMeeting.setHours(19, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        users[1].id,
        oakStreet.rows[0].id,
        'Neighborhood Watch Monthly Meeting',
        'Monthly safety meeting. We\'ll discuss the recent package thefts and holiday security tips. Coffee provided!',
        'Oak Street Community Center',
        watchMeeting.toISOString(),
        new Date(watchMeeting.getTime() + 1.5 * 60 * 60 * 1000).toISOString(),
        'scheduled'
      ]
    );

    // Christmas Lights Contest Kickoff
    const lightsKickoff = new Date(now);
    lightsKickoff.setDate(lightsKickoff.getDate() + 5);
    lightsKickoff.setHours(18, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        users[0].id,
        oakStreet.rows[0].id,
        'Christmas Lights Contest Kickoff! 🎄',
        'Annual neighborhood lights competition begins! Sign up, get your category, and may the best display win. Prizes from local businesses!',
        'Oak Street entrance sign',
        lightsKickoff.toISOString(),
        new Date(lightsKickoff.getTime() + 1 * 60 * 60 * 1000).toISOString(),
        'scheduled'
      ]
    );

    // HOA Board Meeting
    const hoaMeeting = new Date(now);
    hoaMeeting.setDate(hoaMeeting.getDate() + 7);
    hoaMeeting.setHours(19, 30, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, max_attendees, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        users[2].id,
        pineHills.rows[0].id,
        'HOA Board Meeting - December',
        'Agenda: Snow removal contracts, holiday decoration guidelines, 2024 budget review. All residents welcome to attend.',
        'Pine Hills Clubhouse',
        hoaMeeting.toISOString(),
        new Date(hoaMeeting.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        40,
        'scheduled'
      ]
    );

    // Kids Cookie Decorating
    const cookieParty = new Date(now);
    cookieParty.setDate(cookieParty.getDate() + 10);
    cookieParty.setHours(14, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, max_attendees, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        users[0].id,
        oakStreet.rows[0].id,
        'Kids Christmas Cookie Decorating Party 🍪',
        'Bring the little ones for cookie decorating! All supplies provided. Ages 4-12. Parents please stay.',
        '456 Oak Street - Community Room',
        cookieParty.toISOString(),
        new Date(cookieParty.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        20,
        'scheduled'
      ]
    );

    // Caroling Walk
    const caroling = new Date(now);
    caroling.setDate(caroling.getDate() + 14);
    caroling.setHours(18, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        users[3].id,
        pineHills.rows[0].id,
        'Neighborhood Caroling Walk 🎵',
        'Join us for our annual caroling walk through the neighborhood! Hot cocoa stops included. Song sheets provided.',
        'Pine Hills Entrance Gate',
        caroling.toISOString(),
        new Date(caroling.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        'scheduled'
      ]
    );

    // New Year's Block Party
    const newYears = new Date(now);
    newYears.setDate(newYears.getDate() + 21);
    newYears.setHours(20, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, max_attendees, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        users[1].id,
        oakStreet.rows[0].id,
        'New Year\'s Eve Block Party 🎉',
        'Ring in 2024 with your neighbors! BYOB, we\'ll provide appetizers. Countdown at midnight, fireworks viewing from the hill!',
        'Oak Street Cul-de-sac',
        newYears.toISOString(),
        new Date(newYears.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        50,
        'scheduled'
      ]
    );

    // Garbage/Recycling Schedule Meeting
    const garbageMeeting = new Date(now);
    garbageMeeting.setDate(garbageMeeting.getDate() + 4);
    garbageMeeting.setHours(10, 0, 0, 0);
    await query(
      `INSERT INTO events (created_by, hub_id, title, description, location, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        users[2].id,
        pineHills.rows[0].id,
        'Holiday Garbage Schedule Info Session',
        'The city changed the pickup schedule again. Come learn the new dates and proper recycling guidelines. Yes, we\'ll address the bin placement issue.',
        'Pine Hills Community Center',
        garbageMeeting.toISOString(),
        new Date(garbageMeeting.getTime() + 1 * 60 * 60 * 1000).toISOString(),
        'scheduled'
      ]
    );

    // Create posts in neighborhoods (mostly private to community)
    const postContents = [
      // Thanksgiving/Black Friday posts
      { text: 'Hope everyone had a wonderful Thanksgiving! Our turkey turned out perfect this year 🦃', public: true },
      { text: 'Black Friday was INSANE at the mall. Never again. Anyone else brave the crowds?', public: false },
      { text: 'Leftover turkey sandwiches for days! Not complaining though 😋', public: false },
      { text: 'Did anyone else see that Amazon truck almost hit the mailboxes on Oak Street??', public: false },
      
      // Halloween memories
      { text: 'Still finding candy wrappers in my bushes from Halloween. Please remind your kids! 🎃', public: false },
      { text: 'The Johnson kids had the BEST costumes this year. That dragon was incredible!', public: true },
      { text: 'Next year we need to coordinate the haunted house better. Too many houses at once!', public: false },
      
      // Christmas prep
      { text: 'Started putting up lights this weekend! Going big this year ✨🎄', public: true },
      { text: 'Anyone have a tall ladder I can borrow? Need to reach the roof peak for my star', public: false },
      { text: 'The Smiths already have their display up. Looking good! Competition is ON', public: false },
      { text: 'Reminder: Please keep inflatables deflated during the day per HOA guidelines', public: false },
      
      // Neighborhood drama/issues
      { text: 'WHOSE TRASH CANS ARE STILL OUT? Its been 3 days people!! 🗑️', public: false },
      { text: 'Someone keeps letting their dog do its business on my lawn. Please clean up after your pets!', public: false },
      { text: 'Package stolen off my porch AGAIN. Getting a Ring camera this week.', public: false },
      { text: 'Suspicious white van circling the block around 3pm today. Everyone be aware!', public: false },
      { text: 'Can we PLEASE talk about the leaf blowing at 7am on Saturdays?? Some of us sleep in! 😤', public: false },
      { text: 'The streetlight on the corner of Oak and Maple is out again. Called the city.', public: false },
      
      // Positive community stuff
      { text: 'Thanks to whoever returned my Amazon package! Faith in neighbors restored ❤️', public: true },
      { text: 'New neighbors moving in at 789 Oak! Everyone say hi to the Martinez family!', public: true },
      { text: 'Block party was a huge success! Thanks everyone who brought food!', public: true },
      { text: 'Lost cat found! Orange tabby is safe at 456 Oak. Owner please claim!', public: true },
      { text: 'Snow expected this week - anyone need help shoveling? Happy to assist elderly neighbors', public: false },
      { text: 'Just baked too many cookies. Dropping some off to neighbors! 🍪', public: false }
    ];

    for (let i = 0; i < postContents.length; i++) {
      const hubId = i % 2 === 0 ? oakStreet.rows[0].id : pineHills.rows[0].id;
      await query(
        `INSERT INTO posts (user_id, hub_id, content, is_public)
         VALUES ($1, $2, $3, $4)`,
        [users[i % 4].id, hubId, postContents[i].text, postContents[i].public]
      );
    }

    // Create some videos for The Feed (neighborhood updates with real YouTube video IDs for thumbnails)
    const videos = [
      {
        title: 'Oak Street Halloween Parade 2023',
        description: 'Highlights from our annual Halloween parade! So many great costumes this year 🎃',
        videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0'
      },
      {
        title: 'Christmas Lights Tour - Oak Street',
        description: 'Drive through tour of our neighborhood lights! Vote for your favorite display',
        videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
      },
      {
        title: 'Suspicious Vehicle Alert - Nov 15',
        description: 'Security camera footage of vehicle casing houses. Please be aware!',
        videoUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8'
      },
      {
        title: 'Block Party BBQ Competition Results!',
        description: 'And the winner of the 3rd Annual Oak Street BBQ Contest is...',
        videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'
      },
      {
        title: 'Lost Dog Reunited with Family!',
        description: 'Happy ending! Thanks to everyone who shared and helped search ❤️',
        videoUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk'
      },
      {
        title: 'Pine Hills HOA Meeting Recap - November',
        description: 'Key decisions from the monthly meeting. Snow removal, decorations, and more.',
        videoUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0'
      }
    ];

    for (let i = 0; i < videos.length; i++) {
      await query(
        `INSERT INTO videos (user_id, hub_id, title, description, video_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          users[i % 4].id,
          i % 2 === 0 ? oakStreet.rows[0].id : pineHills.rows[0].id,
          videos[i].title,
          videos[i].description,
          videos[i].videoUrl
        ]
      );
    }

    // Create marketplace listings (neighbor-to-neighbor sales)
    const listings = [
      {
        title: 'Snow Blower - Honda HS720',
        description: 'Used 2 seasons, works great! Moving to Florida so no longer needed. Can demo.',
        price: 450.00,
        condition: 'good',
        location: '123 Oak Street'
      },
      {
        title: 'Christmas Decorations Bundle',
        description: 'Downsizing! 500 lights, 3 inflatables, lawn ornaments. Take it all for one price.',
        price: 150.00,
        condition: 'good',
        location: '456 Pine Hills Dr'
      },
      {
        title: 'Kids Bikes (2) - Ages 6-10',
        description: 'Schwinn bikes, great condition. Kids outgrew them. $75 each or $120 for both.',
        price: 120.00,
        condition: 'like_new',
        location: '789 Oak Street'
      },
      {
        title: 'FREE: Moving Boxes',
        description: 'About 30 boxes, various sizes. Some packing paper too. Must pick up by Saturday!',
        price: 0.00,
        condition: 'good',
        location: '234 Pine Hills Dr'
      },
      {
        title: 'Lawn Mower - Toro Recycler',
        description: 'Self-propelled, 22 inch. Starts right up. Selling because I hired a lawn service.',
        price: 200.00,
        condition: 'good',
        location: '567 Oak Street'
      },
      {
        title: 'Patio Furniture Set',
        description: '6 piece wicker set with cushions. Used one summer on covered porch. Like new!',
        price: 350.00,
        condition: 'like_new',
        location: '890 Pine Hills Dr'
      },
      {
        title: 'Ring Doorbell + Extra Battery',
        description: 'Upgraded to wired version. This wireless one works perfectly. Easy install.',
        price: 65.00,
        condition: 'like_new',
        location: '321 Oak Street'
      },
      {
        title: 'Thanksgiving Turkey Fryer',
        description: 'Used twice, still has original box. Makes amazing turkey! Safety features.',
        price: 80.00,
        condition: 'like_new',
        location: '654 Pine Hills Dr'
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
          i % 2 === 0 ? oakStreet.rows[0].id : pineHills.rows[0].id,
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
      'Can you hold it until Saturday? I can pick up then.',
      'Great price! My husband is interested.',
      'Would you take $50? Cash today.',
      'Do you still have this? I live on Oak Street - easy pickup!'
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
        neighborhoods: 2,
        events: 8,
        posts: postContents.length,
        videos: videos.length,
        listings: listings.length,
        publicPosts: postContents.filter(p => p.public).length,
        privatePosts: postContents.filter(p => !p.public).length
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
