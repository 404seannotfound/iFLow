# 🚀 iFlow Quick Start Guide

Get your iFlow application running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/iflow
JWT_SECRET=your-random-secret-key-here
```

## Step 3: Create Database

```bash
# Create the database
createdb iflow

# Run the schema
psql iflow < database/schema.sql
```

## Step 4: Start Development

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## Step 5: Test It Out

1. Open http://localhost:5173 in your browser
2. Click "Sign Up" to create an account
3. Explore the features!

## 🚢 Deploy to Render.com

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render auto-deploys everything!

3. **Initialize Database**
   - Get the database URL from Render dashboard
   - Run: `psql <DATABASE_URL> < database/schema.sql`

4. **Done!** Your app is live 🎉

## 📚 Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment info
- Check [README.md](./README.md) for full documentation
- Review the PRD section in README for feature specifications

## 🆘 Troubleshooting

**Database connection fails?**
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running: `pg_isready`

**Build fails?**
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (need 18+)

**Port already in use?**
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:3000 | xargs kill`

## 💡 Tips

- Use `npm run server:dev` to run backend only
- Use `npm run client:dev` to run frontend only
- Check logs in terminal for errors
- API docs available at `/api/health`

---

**Happy flowing!** 🌊✨
