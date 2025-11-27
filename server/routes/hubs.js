import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all hubs
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.id, h.name, h.description, h.location, h.avatar_url,
              h.member_count, h.created_at,
              EXISTS(SELECT 1 FROM hub_members WHERE hub_id = h.id AND user_id = $1 AND is_active = true) as is_member
       FROM hubs h
       WHERE h.is_active = true
       ORDER BY h.member_count DESC
       LIMIT 50`,
      [req.user?.userId || null]
    );

    res.json({ hubs: result.rows });
  } catch (error) {
    console.error('Get hubs error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch hubs' } });
  }
});

// Get single hub
router.get('/:hubId', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, 
              EXISTS(SELECT 1 FROM hub_members WHERE hub_id = h.id AND user_id = $2 AND is_active = true) as is_member,
              json_agg(DISTINCT jsonb_build_object(
                'userId', hm.user_id,
                'role', hm.role,
                'username', u.username,
                'displayName', u.display_name,
                'avatarUrl', u.avatar_url
              )) FILTER (WHERE hm.id IS NOT NULL) as members
       FROM hubs h
       LEFT JOIN hub_members hm ON h.id = hm.hub_id AND hm.is_active = true
       LEFT JOIN users u ON hm.user_id = u.id
       WHERE h.id = $1 AND h.is_active = true
       GROUP BY h.id`,
      [req.params.hubId, req.user?.userId || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Hub not found' } });
    }

    res.json({ hub: result.rows[0] });
  } catch (error) {
    console.error('Get hub error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch hub' } });
  }
});

// Create hub
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, location, latitude, longitude } = req.body;

  try {
    const result = await query(
      `INSERT INTO hubs (name, description, location, latitude, longitude, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, location, latitude, longitude, req.user.userId]
    );

    // Add creator as admin
    await query(
      `INSERT INTO hub_members (hub_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [result.rows[0].id, req.user.userId]
    );

    res.status(201).json({ hub: result.rows[0] });
  } catch (error) {
    console.error('Create hub error:', error);
    res.status(500).json({ error: { message: 'Failed to create hub' } });
  }
});

// Join hub
router.post('/:hubId/join', authenticateToken, async (req, res) => {
  try {
    await query(
      `INSERT INTO hub_members (hub_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (hub_id, user_id) DO UPDATE SET is_active = true`,
      [req.params.hubId, req.user.userId]
    );

    // Update member count
    await query(
      `UPDATE hubs SET member_count = (
        SELECT COUNT(*) FROM hub_members WHERE hub_id = $1 AND is_active = true
       ) WHERE id = $1`,
      [req.params.hubId]
    );

    res.json({ message: 'Joined hub successfully' });
  } catch (error) {
    console.error('Join hub error:', error);
    res.status(500).json({ error: { message: 'Failed to join hub' } });
  }
});

// Get hub posts
router.get('/:hubId/posts', optionalAuth, async (req, res) => {
  try {
    // If not authenticated, only show public posts
    const publicFilter = req.user ? '' : 'AND p.is_public = true';
    
    const result = await query(
      `SELECT p.*, u.username, u.display_name, u.avatar_url,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
              (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
              EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as user_has_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.hub_id = $1 ${publicFilter}
       ORDER BY p.is_pinned DESC, p.created_at DESC`,
      [req.params.hubId, req.user?.userId || null]
    );

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Get hub posts error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch posts' } });
  }
});

// Create hub post
router.post('/:hubId/posts', authenticateToken, async (req, res) => {
  const { content } = req.body;

  try {
    const result = await query(
      `INSERT INTO posts (hub_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.hubId, req.user.userId, content]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: { message: 'Failed to create post' } });
  }
});

export default router;
