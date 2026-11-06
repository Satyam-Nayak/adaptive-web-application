
const pool = require("../config/database");

// Record a user behaviour event
const recordEvent = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      event_type,
      page_url,
      content_id,
      event_data,
      duration_seconds,
    } = req.body;

    if (
      typeof event_type !== "string" ||
      !event_type.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "event_type is required",
      });
    }

    if (
      duration_seconds !== undefined &&
      (
        !Number.isInteger(duration_seconds) ||
        duration_seconds < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "duration_seconds must be a non-negative integer",
      });
    }

    if (
      event_data !== undefined &&
      (
        event_data === null ||
        typeof event_data !== "object" ||
        Array.isArray(event_data)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "event_data must be a JSON object",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO behaviour_events
       (
         user_id,
         event_type,
         page_url,
         content_id,
         event_data,
         duration_seconds
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        event_type.trim(),
        page_url || null,
        content_id ?? null,
        event_data === undefined
          ? null
          : JSON.stringify(event_data),
        duration_seconds ?? 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Behaviour event recorded successfully",
      data: {
        id: result.insertId,
        user_id: userId,
        event_type: event_type.trim(),
      },
    });
  } catch (error) {
    console.error("Record behaviour event:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to record behaviour event",
    });
  }
};

// Get the authenticated user's behaviour events
const getEvents = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [events] = await pool.query(
      `SELECT
         id,
         event_type,
         page_url,
         content_id,
         event_data,
         duration_seconds,
         created_at
       FROM behaviour_events
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Get behaviour events:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve behaviour events",
    });
  }
};

module.exports = {
  recordEvent,
  getEvents,
};
