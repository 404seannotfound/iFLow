import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get posts feed
router.get('/', optionalAuth, async (req, res) => {
  const { hubId, limit = 50 } = req.query;

  try {
    let queryText = `
      SELECT p.*, u.username, u.display_name, u.avatar_url,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [req.user?.userId || null];

    if (hubId) {
      queryText += ` AND p.hub_id = $2`;
      params.push(hubId);
    }

    queryText += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);
    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch posts' } });
  }
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  const { content, hubId } = req.body;

  if (!content || content.length > 280) {
    return res.status(400).json({ error: { message: 'Content must be 1-280 characters' } });
  }

  try {
    const result = await query(
      `INSERT INTO posts (user_id, hub_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.userId, hubId, content]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: { message: 'Failed to create post' } });
  }
});

// Like/React to post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { emoji = '❤️' } = req.body;
    
    await query(
      `INSERT INTO post_likes (post_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id, emoji) DO NOTHING`,
      [req.params.postId, req.user.userId, emoji]
    );

    res.json({ message: 'Reaction added' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: { message: 'Failed to add reaction' } });
  }
});

export default router;
