
const pool = require("../config/database");


 // Create a session for the authenticated user
const createSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [result] = await pool.query(
      `INSERT INTO user_sessions (user_id)
       VALUES (?)`,
      [userId]
    );

    return res.status(201).json({
      success: true,
      message: "User session created successfully",
      data: {
        session_id: Number(result.insertId),
      },
    });
  } catch (error) {
    console.error("Create user session:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create user session",
    });
  }
};


// Record a user behaviour event
const recordEvent = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      session_id,
      event_type,
      page_url,
      content_id,
      event_data,
      duration_seconds,
    } = req.body;

    // Validate event_type
    if (
      typeof event_type !== "string" ||
      !event_type.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "event_type is required",
      });
    }

    // Validate session_id (MySQL BIGINT)
    if (
      session_id !== undefined &&
      session_id !== null &&
      (
        !Number.isSafeInteger(session_id) ||
        session_id <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "session_id must be a positive safe integer",
      });
    }

    // Validate duration_seconds
    if (
      duration_seconds !== undefined &&
      (
        !Number.isInteger(duration_seconds) ||
        duration_seconds < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "duration_seconds must be a non-negative integer",
      });
    }

    // Validate event_data
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

    // Insert behaviour event
    const [result] = await pool.query(
      `INSERT INTO behaviour_events
       (
         user_id,
         session_id,
         event_type,
         page_url,
         content_id,
         event_data,
         duration_seconds
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        session_id ?? null,
        event_type.trim(),
        page_url || null,
        content_id ?? null,
        event_data === undefined
          ? null
          : JSON.stringify(event_data),
        duration_seconds ?? 0,
      ]
    );

    // Finalize the session when the user exits the page
if (event_type.trim() === "page_exit" && session_id != null) {
  await pool.query(
    `UPDATE user_sessions
     SET
       session_end = CURRENT_TIMESTAMP,
       duration_seconds = TIMESTAMPDIFF(
         SECOND,
         session_start,
         CURRENT_TIMESTAMP
       )
     WHERE id = ?
       AND user_id = ?
       AND session_end IS NULL`,
    [session_id, userId]
  );
}

    return res.status(201).json({
      success: true,
      message: "Behaviour event recorded successfully",
      data: {
        id: result.insertId,
        user_id: userId,
        session_id: session_id ?? null,
        event_type: event_type.trim(),
      },
    });
  } catch (error) {
    console.error(
      "Record behaviour event:",
      error.message
    );

    
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
         user_id,
         session_id,
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
    console.error(
      "Get behaviour events:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve behaviour events",
    });
  }
};

module.exports = {
  createSession,
  recordEvent,
  getEvents,
};
