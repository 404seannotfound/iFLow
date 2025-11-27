import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get marketplace listings
router.get('/', optionalAuth, async (req, res) => {
  const { hubId, propTag, status = 'active', limit = 50 } = req.query;

  try {
    let queryText = `
      SELECT ml.*, u.username, u.display_name, u.avatar_url,
             json_agg(DISTINCT jsonb_build_object(
               'id', pt.id,
               'name', pt.name
             )) FILTER (WHERE pt.id IS NOT NULL) as prop_tags
      FROM marketplace_listings ml
      JOIN users u ON ml.user_id = u.id
      LEFT JOIN marketplace_prop_tags mpt ON ml.id = mpt.listing_id
      LEFT JOIN prop_tags pt ON mpt.prop_tag_id = pt.id
      WHERE ml.status = $1
    `;

    const params = [status];
    let paramCount = 2;

    if (hubId) {
      queryText += ` AND ml.hub_id = $${paramCount}`;
      params.push(hubId);
      paramCount++;
    }

    queryText += ` GROUP BY ml.id, u.username, u.display_name, u.avatar_url
                   ORDER BY ml.created_at DESC
                   LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);
    res.json({ listings: result.rows });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch listings' } });
  }
});

// Create listing
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, price, condition, listingType, location, hubId, propTags, imageUrls } = req.body;

  try {
    const result = await query(
      `INSERT INTO marketplace_listings (user_id, hub_id, title, description, 
                                         price, condition, listing_type, location, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.userId, hubId, title, description, price, condition, listingType, location, imageUrls]
    );

    const listingId = result.rows[0].id;

    // Add prop tags
    if (propTags && propTags.length > 0) {
      for (const tagId of propTags) {
        await query(
          `INSERT INTO marketplace_prop_tags (listing_id, prop_tag_id) VALUES ($1, $2)`,
          [listingId, tagId]
        );
      }
    }

    res.status(201).json({ listing: result.rows[0] });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: { message: 'Failed to create listing' } });
  }
});

export default router;
