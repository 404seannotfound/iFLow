# 🔧 iFlow Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### `npm install` fails

**Error**: `EACCES: permission denied`
```bash
# Solution: Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

**Error**: `node-gyp` build fails
```bash
# Solution: Install build tools
# macOS:
xcode-select --install

# Linux:
sudo apt-get install build-essential
```

**Error**: Package version conflicts
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## Database Issues

### Cannot connect to PostgreSQL

**Error**: `Connection refused`
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

**Error**: `database "iflow" does not exist`
```bash
# Create the database
createdb iflow

# Or using psql
psql postgres
CREATE DATABASE iflow;
\q
```

**Error**: `role "username" does not exist`
```bash
# Create PostgreSQL user
createuser -s your_username

# Or set DATABASE_URL with existing user
DATABASE_URL=postgresql://postgres:password@localhost:5432/iflow
```

### Schema migration fails

**Error**: `relation already exists`
```bash
# Drop and recreate database
dropdb iflow
createdb iflow
psql iflow < database/schema.sql
```

**Error**: `permission denied for schema public`
```bash
# Grant permissions
psql iflow
GRANT ALL ON SCHEMA public TO your_username;
\q
```

## Development Server Issues

### Port already in use

**Error**: `Port 3000 is already in use`
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill

# Or change port in .env
PORT=3001
```

**Error**: `Port 5173 is already in use`
```bash
# Kill Vite process
lsof -ti:5173 | xargs kill

# Or change in vite.config.js
server: { port: 5174 }
```

### Backend won't start

**Error**: `Cannot find module`
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**Error**: `JWT_SECRET is not defined`
```bash
# Add to .env file
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

**Error**: `DATABASE_URL is not defined`
```bash
# Add to .env file
echo "DATABASE_URL=postgresql://localhost:5432/iflow" >> .env
```

### Frontend won't start

**Error**: `Failed to resolve import`
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run client:dev
```

**Error**: Blank white screen
```bash
# Check browser console for errors
# Common fix: Clear browser cache and reload
```

## Runtime Errors

### Authentication Issues

**Error**: `Invalid or expired token`
```bash
# Clear localStorage and login again
# In browser console:
localStorage.clear()
# Then reload and login
```

**Error**: `User not found`
```bash
# Check if user exists in database
psql iflow
SELECT * FROM users WHERE username = 'your_username';
```

**Error**: CORS errors in browser
```bash
# Check CLIENT_URL in .env matches frontend URL
CLIENT_URL=http://localhost:5173

# Restart backend after changing .env
```

### API Request Failures

**Error**: `404 Not Found`
```bash
# Check API endpoint spelling
# Verify route is defined in server/index.js
# Check server logs for routing issues
```

**Error**: `500 Internal Server Error`
```bash
# Check server logs for stack trace
# Common causes:
# - Database connection lost
# - Missing required fields
# - SQL syntax errors
```

**Error**: Network request failed
```bash
# Verify backend is running
curl http://localhost:3000/api/health

# Check proxy in vite.config.js
# Verify no firewall blocking
```

### Database Query Errors

**Error**: `syntax error at or near`
```bash
# SQL syntax error - check query in route file
# Use parameterized queries: $1, $2, etc.
# Check for missing commas or quotes
```

**Error**: `null value in column violates not-null constraint`
```bash
# Missing required field in request
# Check API endpoint requirements
# Verify all required fields are sent
```

**Error**: `duplicate key value violates unique constraint`
```bash
# Trying to create duplicate entry
# Check UNIQUE constraints in schema
# Common: username or email already exists
```

## Build Issues

### Production build fails

**Error**: `Build failed with errors`
```bash
# Check for TypeScript/ESLint errors
# Fix import paths (use @ alias)
# Verify all dependencies installed
```

**Error**: `Out of memory`
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Error**: Missing environment variables
```bash
# Set production env vars in Render dashboard
# Or create .env.production locally
```

## Deployment Issues (Render.com)

### Build fails on Render

**Error**: `npm install` fails
```bash
# Check package.json for correct dependencies
# Verify Node version in package.json engines
# Check Render build logs for specific error
```

**Error**: `npm run build` fails
```bash
# Test build locally first
npm run build

# Check for environment-specific issues
# Verify all imports are correct
```

### Database connection fails

**Error**: Cannot connect to database
```bash
# Verify DATABASE_URL is set correctly
# Use INTERNAL database URL, not external
# Check database is in same region as web service
```

**Error**: SSL connection error
```bash
# Ensure SSL is configured in db.js
ssl: process.env.NODE_ENV === 'production' ? {
  rejectUnauthorized: false
} : false
```

### Application crashes after deploy

**Error**: App keeps restarting
```bash
# Check Render logs for error
# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port binding issues (use process.env.PORT)
```

**Error**: Health check failing
```bash
# Verify /api/health endpoint works
curl https://your-app.onrender.com/api/health

# Check healthCheckPath in render.yaml
# Ensure endpoint returns 200 status
```

## Performance Issues

### Slow database queries

```bash
# Check query performance
EXPLAIN ANALYZE SELECT * FROM videos;

# Add missing indexes
CREATE INDEX idx_name ON table_name(column_name);

# Use pagination
LIMIT 20 OFFSET 0
```

### Slow page loads

```bash
# Check Network tab in browser DevTools
# Optimize images (compress, resize)
# Enable compression middleware
# Use CDN for static assets
```

### High memory usage

```bash
# Check for memory leaks
# Reduce connection pool size
# Implement pagination
# Clear unused caches
```

## Common Mistakes

### Forgot to start database
```bash
# Always check PostgreSQL is running
pg_isready
```

### Wrong database URL format
```bash
# Correct format:
postgresql://username:password@host:port/database

# Not:
postgres://... (old format, may work but use postgresql://)
```

### Missing .env file
```bash
# Always create from template
cp .env.example .env
# Then edit with your values
```

### Not restarting server after .env changes
```bash
# Always restart after changing .env
# Ctrl+C then npm run dev
```

### Mixing up ports
```bash
# Backend: 3000
# Frontend: 5173
# Make sure you're accessing the right one
```

## Debugging Tips

### Enable verbose logging

```javascript
// In server/database/db.js
console.log('Executing query:', text);
console.log('With params:', params);
```

### Check database state

```bash
# Connect to database
psql iflow

# List tables
\dt

# Check table contents
SELECT * FROM users LIMIT 5;

# Check table structure
\d users
```

### Test API endpoints

```bash
# Use curl to test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Or use Postman/Insomnia
```

### Check browser console

```javascript
// In browser console, check:
localStorage.getItem('iflow-auth')
// Should show stored auth state

// Check for errors
console.log('Errors:', window.errors)
```

## Getting Help

### Check logs

**Backend logs**
```bash
# Development
# Logs appear in terminal where you ran npm run dev

# Production (Render)
# View in Render dashboard > Logs
```

**Frontend logs**
```bash
# Browser console (F12 or Cmd+Option+I)
# Check Console tab for errors
# Check Network tab for failed requests
```

### Useful commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check running processes
ps aux | grep node
ps aux | grep postgres

# Check port usage
lsof -i :3000
lsof -i :5173

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

## Still stuck?

1. **Read the error message carefully** - It usually tells you what's wrong
2. **Check the logs** - Backend terminal and browser console
3. **Search the error** - Google the exact error message
4. **Check documentation** - README.md, DEPLOYMENT.md, ARCHITECTURE.md
5. **Start fresh** - Sometimes easiest to delete and reinstall
6. **Ask for help** - Create an issue with:
   - What you were trying to do
   - What happened instead
   - Error messages
   - Your environment (OS, Node version, etc.)

---

**Remember**: Most issues are simple fixes. Take a deep breath, read the error, and work through it step by step! 🌊
