const db = require('../config/db');

// Get all notifications for a user
exports.getNotifications = (req, res) => {
    const { user_id } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    const query = `
        SELECT id, type, title, message, is_read, created_at 
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `;

    db.query(query, [user_id, limit, offset], (err, results) => {
        if (err) {
            console.error("Get Notifications Error:", err);
            return res.status(500).json({ message: "Failed to fetch notifications" });
        }

        res.status(200).json({
            message: "Notifications retrieved successfully",
            data: results
        });
    });
};

// Get unread notification count
exports.getUnreadCount = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    const query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error("Get Unread Count Error:", err);
            return res.status(500).json({ message: "Failed to get unread count" });
        }

        res.status(200).json({
            message: "Unread count retrieved successfully",
            count: results[0].count
        });
    });
};

// Mark notification as read
exports.markAsRead = (req, res) => {
    const { id } = req.params;

    const query = "UPDATE notifications SET is_read = TRUE WHERE id = ?";

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Mark As Read Error:", err);
            return res.status(500).json({ message: "Failed to mark notification as read" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification marked as read" });
    });
};

// Mark all notifications as read for a user
exports.markAllAsRead = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required" });
    }

    const query = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE";

    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error("Mark All As Read Error:", err);
            return res.status(500).json({ message: "Failed to mark all notifications as read" });
        }

        res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.affectedRows
        });
    });
};

// Create a notification (internal helper function)
exports.createNotification = (user_id, type, title, message, callback) => {
    console.log('📢 Creating notification:', { user_id, type, title, message });

    const query = "INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)";

    db.query(query, [user_id, type, title, message], (err, result) => {
        if (err) {
            console.error("❌ Create Notification Error:", err);
            if (callback) callback(err, null);
            return;
        }

        console.log('✅ Notification created successfully! ID:', result.insertId);
        if (callback) callback(null, result);
    });
};
