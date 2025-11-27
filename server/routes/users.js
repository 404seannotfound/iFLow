import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, 
              u.location, u.created_at,
              json_agg(DISTINCT jsonb_build_object(
                'type', vb.badge_type,
                'verifiedAt', vb.verified_at
              )) FILTER (WHERE vb.id IS NOT NULL) as badges,
              json_agg(DISTINCT jsonb_build_object(
                'platform', ul.platform,
                'url', ul.url,
                'displayText', ul.display_text
              )) FILTER (WHERE ul.id IS NOT NULL) as links
       FROM users u
       LEFT JOIN verification_badges vb ON u.id = vb.user_id AND vb.is_active = true
       LEFT JOIN user_links ul ON u.id = ul.user_id
       WHERE u.id = $1 AND u.is_active = true
       GROUP BY u.id`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch user' } });
  }
});

// Update user profile
router.patch('/me', authenticateToken, async (req, res) => {
  const { displayName, bio, location, avatarUrl } = req.body;
  
  try {
    const result = await query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           location = COALESCE($3, location),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, username, display_name, bio, location, avatar_url`,
      [displayName, bio, location, avatarUrl, req.user.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update profile' } });
  }
});

export default router;
