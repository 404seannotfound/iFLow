import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  console.log('🚀 Starting database initialization...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // Read schema file
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    console.log('📄 Loaded schema.sql');

    // Execute schema
    console.log('🔨 Creating tables and indexes...');
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    // Create default user
    console.log('\n👤 Creating default user...');
    const passwordHash = await bcrypt.hash('seansean', 10);
    
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, display_name, bio) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, display_name, created_at`,
      ['sean', 'seansp@gmail.com', passwordHash, 'Sean', 'iFlow Admin']
    );

    const user = result.rows[0];
    console.log('✅ User created successfully:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.display_name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);

    console.log('\n🎉 Database initialization complete!');
    console.log('\n📝 Login credentials:');
    console.log('   Username: sean');
    console.log('   Password: seansean');
    console.log('   Email: seansp@gmail.com');

  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run initialization
initDatabase();
