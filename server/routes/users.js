import express from 'express';
import bcrypt from 'bcryptjs';
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

// Update user profile by ID
router.put('/:userId', authenticateToken, async (req, res) => {
  const { display_name, bio, location, avatar_url } = req.body;
  
  // Only allow users to update their own profile
  if (req.params.userId !== req.user.userId) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
  }
  
  try {
    const result = await query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           location = COALESCE($3, location),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, display_name, bio, location, avatar_url`,
      [display_name, bio, location, avatar_url, req.user.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update profile' } });
  }
});

// Change password
router.put('/:userId/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Only allow users to change their own password
  if (req.params.userId !== req.user.userId) {
    return res.status(403).json({ error: { message: 'Unauthorized' } });
  }
  
  try {
    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Current password is incorrect' } });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Failed to change password' } });
  }
});

export default router;
