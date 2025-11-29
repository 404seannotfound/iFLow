import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get events (with filters)
router.get('/', optionalAuth, async (req, res) => {
  const { hubId, startDate, endDate } = req.query;
  
  try {
    let queryText = `
      SELECT e.*, h.name as hub_name,
             json_agg(DISTINCT jsonb_build_object(
               'userId', ei.user_id,
               'role', ei.role,
               'username', u.username,
               'displayName', u.display_name
             )) FILTER (WHERE ei.id IS NOT NULL) as instructors,
             (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as going_count,
             (SELECT status FROM event_rsvps WHERE event_id = e.id AND user_id = $1) as user_rsvp_status
      FROM events e
      LEFT JOIN hubs h ON e.hub_id = h.id
      LEFT JOIN event_instructors ei ON e.id = ei.event_id
      LEFT JOIN users u ON ei.user_id = u.id
      WHERE e.status = 'scheduled'
    `;
    
    const params = [req.user?.userId || null];
    let paramCount = 2;

    if (hubId) {
      queryText += ` AND e.hub_id = $${paramCount}`;
      params.push(hubId);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND e.start_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND e.start_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ` GROUP BY e.id, h.name ORDER BY e.start_time ASC LIMIT 50`;

    const result = await query(queryText, params);
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch events' } });
  }
});

// Create event
router.post('/', authenticateToken, async (req, res) => {
  const { hubId, title, description, location, startTime, endTime, isFireEvent, maxAttendees } = req.body;

  try {
    // Check for conflicts
    const conflicts = await query(
      `SELECT id, title FROM events 
       WHERE hub_id = $1 
       AND status = 'scheduled'
       AND (
         (start_time, end_time) OVERLAPS ($2::timestamp, $3::timestamp)
       )`,
      [hubId, startTime, endTime]
    );

    if (conflicts.rows.length > 0) {
      return res.status(409).json({ 
        error: { 
          message: 'Event time conflicts with existing event',
          conflicts: conflicts.rows 
        } 
      });
    }

    const result = await query(
      `INSERT INTO events (hub_id, created_by, title, description, location, 
                          start_time, end_time, is_fire_event, max_attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [hubId, req.user.userId, title, description, location, startTime, endTime, isFireEvent, maxAttendees]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: { message: 'Failed to create event' } });
  }
});

// RSVP to event
router.post('/:eventId/rsvp', authenticateToken, async (req, res) => {
  const { status } = req.body; // 'going', 'interested', 'not_going'

  try {
    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) 
       DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP`,
      [req.params.eventId, req.user.userId, status]
    );

    res.json({ message: 'RSVP updated successfully' });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: { message: 'Failed to update RSVP' } });
  }
});

// Clear RSVP (remove response)
router.delete('/:eventId/rsvp', authenticateToken, async (req, res) => {
  try {
    await query(
      `DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
      [req.params.eventId, req.user.userId]
    );

    res.json({ message: 'RSVP cleared successfully' });
  } catch (error) {
    console.error('Clear RSVP error:', error);
    res.status(500).json({ error: { message: 'Failed to clear RSVP' } });
  }
});

// Update event
router.put('/:eventId', authenticateToken, async (req, res) => {
  const { title, description, location, startTime, endTime, maxAttendees, hubId, isFireEvent } = req.body;

  try {
    // Check if user owns the event
    const ownerCheck = await query(
      'SELECT created_by FROM events WHERE id = $1',
      [req.params.eventId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    if (ownerCheck.rows[0].created_by !== req.user.userId) {
      return res.status(403).json({ error: { message: 'You can only edit your own events' } });
    }

    const result = await query(
      `UPDATE events 
       SET title = $1, description = $2, location = $3,
           start_time = $4, end_time = $5, max_attendees = $6, hub_id = $7, is_fire_event = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, description, location, startTime, endTime, maxAttendees, hubId, isFireEvent, req.params.eventId]
    );

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: { message: 'Failed to update event' } });
  }
});

// Delete event
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    // Check if user owns the event
    const ownerCheck = await query(
      'SELECT created_by FROM events WHERE id = $1',
      [req.params.eventId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    if (ownerCheck.rows[0].created_by !== req.user.userId) {
      return res.status(403).json({ error: { message: 'You can only delete your own events' } });
    }

    // Delete RSVPs first (foreign key constraint)
    await query('DELETE FROM event_rsvps WHERE event_id = $1', [req.params.eventId]);
    
    // Delete the event
    await query('DELETE FROM events WHERE id = $1', [req.params.eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: { message: 'Failed to delete event' } });
  }
});

export default router;
