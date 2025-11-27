import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get video feed
router.get('/', optionalAuth, async (req, res) => {
  const { hubId, propTag, limit = 20, offset = 0 } = req.query;

  try {
    let queryText = `
      SELECT v.*, u.username, u.display_name, u.avatar_url,
             json_agg(DISTINCT jsonb_build_object(
               'id', pt.id,
               'name', pt.name,
               'category', pt.category
             )) FILTER (WHERE pt.id IS NOT NULL) as prop_tags,
             EXISTS(SELECT 1 FROM video_likes WHERE video_id = v.id AND user_id = $1) as is_liked
      FROM videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_prop_tags vpt ON v.id = vpt.video_id
      LEFT JOIN prop_tags pt ON vpt.prop_tag_id = pt.id
      WHERE v.is_active = true
    `;

    const params = [req.user?.userId || null];
    let paramCount = 2;

    if (hubId) {
      queryText += ` AND v.hub_id = $${paramCount}`;
      params.push(hubId);
      paramCount++;
    }

    if (propTag) {
      queryText += ` AND EXISTS(
        SELECT 1 FROM video_prop_tags vpt2 
        JOIN prop_tags pt2 ON vpt2.prop_tag_id = pt2.id 
        WHERE vpt2.video_id = v.id AND pt2.name = $${paramCount}
      )`;
      params.push(propTag);
      paramCount++;
    }

    queryText += ` GROUP BY v.id, u.username, u.display_name, u.avatar_url
                   ORDER BY v.created_at DESC
                   LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    
    params.push(limit, offset);

    const result = await query(queryText, params);
    res.json({ videos: result.rows });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch videos' } });
  }
});

// Upload video
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, hubId, propTags, isPremium, premiumPrice } = req.body;

  try {
    const result = await query(
      `INSERT INTO videos (user_id, hub_id, title, description, video_url, 
                          thumbnail_url, is_premium, premium_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.userId, hubId, title, description, videoUrl, thumbnailUrl, isPremium, premiumPrice]
    );

    const videoId = result.rows[0].id;

    // Add prop tags
    if (propTags && propTags.length > 0) {
      for (const tagId of propTags) {
        await query(
          `INSERT INTO video_prop_tags (video_id, prop_tag_id) VALUES ($1, $2)`,
          [videoId, tagId]
        );
      }
    }

    res.status(201).json({ video: result.rows[0] });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: { message: 'Failed to upload video' } });
  }
});

// Like video
router.post('/:videoId/like', authenticateToken, async (req, res) => {
  try {
    await query(
      `INSERT INTO video_likes (video_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (video_id, user_id) DO NOTHING`,
      [req.params.videoId, req.user.userId]
    );

    res.json({ message: 'Video liked' });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ error: { message: 'Failed to like video' } });
  }
});

// Unlike video
router.delete('/:videoId/like', authenticateToken, async (req, res) => {
  try {
    await query(
      `DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2`,
      [req.params.videoId, req.user.userId]
    );

    res.json({ message: 'Video unliked' });
  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({ error: { message: 'Failed to unlike video' } });
  }
});

export default router;
