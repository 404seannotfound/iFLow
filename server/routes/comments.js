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

// Delete comment (and all children due to CASCADE)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  const { commentId } = req.params;

  try {
    // First check if user owns the comment
    // Try all comment tables since we don't know which one it's in
    const tables = ['event_comments', 'post_comments', 'video_comments', 'listing_comments'];
    let deleted = false;

    for (const table of tables) {
      const checkResult = await query(
        `SELECT user_id FROM ${table} WHERE id = $1`,
        [commentId]
      );

      if (checkResult.rows.length > 0) {
        if (checkResult.rows[0].user_id !== req.user.userId) {
          return res.status(403).json({ error: { message: 'You can only delete your own comments' } });
        }

        // Delete the comment (CASCADE will delete children and likes)
        await query(`DELETE FROM ${table} WHERE id = $1`, [commentId]);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: { message: 'Comment not found' } });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: { message: 'Failed to delete comment' } });
  }
});

export default router;
