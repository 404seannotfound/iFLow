import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
              json_agg(DISTINCT jsonb_build_object(
                'userId', u.id,
                'username', u.username,
                'displayName', u.display_name,
                'avatarUrl', u.avatar_url
              )) FILTER (WHERE u.id IS NOT NULL AND u.id != $1) as participants
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != $1
       LEFT JOIN users u ON cp2.user_id = u.id
       WHERE cp.user_id = $1
       GROUP BY c.id
       ORDER BY last_message_at DESC NULLS LAST`,
      [req.user.userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch conversations' } });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, u.username, u.display_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.conversationId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch messages' } });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const { content, mediaUrl } = req.body;

  try {
    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, media_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.conversationId, req.user.userId, content, mediaUrl]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: { message: 'Failed to send message' } });
  }
});

export default router;
