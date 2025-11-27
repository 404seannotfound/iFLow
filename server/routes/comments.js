import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get comments for an item (event, post, video, listing)
router.get('/:itemType/:itemId/comments', async (req, res) => {
  const { itemType, itemId } = req.params;
  
  // Map item types to table names
  const tableMap = {
    'events': 'event_comments',
    'posts': 'post_comments',
    'videos': 'video_comments',
    'marketplace': 'listing_comments'
  };
  
  const table = tableMap[itemType];
  if (!table) {
    return res.status(400).json({ error: { message: 'Invalid item type' } });
  }

  try {
    const result = await query(
      `SELECT c.*, u.username, u.display_name,
              (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
       FROM ${table} c
       JOIN users u ON c.user_id = u.id
       WHERE c.${itemType === 'marketplace' ? 'listing' : itemType.slice(0, -1)}_id = $1
       ORDER BY c.created_at DESC`,
      [itemId]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch comments' } });
  }
});

// Create comment
router.post('/:itemType/:itemId/comments', authenticateToken, async (req, res) => {
  const { itemType, itemId } = req.params;
  const { content } = req.body;

  const tableMap = {
    'events': 'event_comments',
    'posts': 'post_comments',
    'videos': 'video_comments',
    'marketplace': 'listing_comments'
  };
  
  const table = tableMap[itemType];
  if (!table) {
    return res.status(400).json({ error: { message: 'Invalid item type' } });
  }

  try {
    const columnName = itemType === 'marketplace' ? 'listing_id' : `${itemType.slice(0, -1)}_id`;
    
    const result = await query(
      `INSERT INTO ${table} (${columnName}, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [itemId, req.user.userId, content]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: { message: 'Failed to create comment' } });
  }
});

// Like comment
router.post('/comments/:commentId/like', authenticateToken, async (req, res) => {
  const { commentId } = req.params;

  try {
    await query(
      `INSERT INTO comment_likes (comment_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (comment_id, user_id) DO NOTHING`,
      [commentId, req.user.userId]
    );

    res.json({ message: 'Comment liked' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: { message: 'Failed to like comment' } });
  }
});

export default router;
