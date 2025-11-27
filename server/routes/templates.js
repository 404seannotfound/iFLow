import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all templates (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM content_templates ORDER BY category, key`,
      []
    );

    // Return as key-value pairs for easy lookup
    const templates = {};
    result.rows.forEach(row => {
      templates[row.key] = row.content;
    });

    res.json({ templates, details: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    // If table doesn't exist yet, return empty templates
    if (error.message && error.message.includes('does not exist')) {
      return res.json({ templates: {}, details: [] });
    }
    res.status(500).json({ error: { message: 'Failed to fetch templates' } });
  }
});

// Get single template by key (public)
router.get('/:key', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM content_templates WHERE key = $1`,
      [req.params.key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch template' } });
  }
});

// Update template (admin only - no auth for now, add later)
router.put('/:key', async (req, res) => {
  const { content } = req.body;

  try {
    const result = await query(
      `UPDATE content_templates 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key = $2
       RETURNING *`,
      [content, req.params.key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: { message: 'Failed to update template' } });
  }
});

// Bulk update templates (admin only)
router.post('/bulk-update', async (req, res) => {
  const { updates } = req.body; // Array of {key, content}

  try {
    const results = [];
    for (const update of updates) {
      const result = await query(
        `UPDATE content_templates 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE key = $2
         RETURNING *`,
        [update.content, update.key]
      );
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    res.json({ templates: results, count: results.length });
  } catch (error) {
    console.error('Bulk update templates error:', error);
    res.status(500).json({ error: { message: 'Failed to update templates' } });
  }
});

export default router;
