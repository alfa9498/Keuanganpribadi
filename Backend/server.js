const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const userController = require("./controllers/userController");
const transactionController = require("./controllers/transactionController");
const notificationController = require("./controllers/notificationController");

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.WEBHOOK_URL
].filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Make io accessible globally
global.io = io;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) console.log('Body:', req.body);
  next();
});

// Test Endpoint
app.get("/ping", (req, res) => {
  console.log("🏓 PING RECEIVED - Server is working!");
  res.send("PONG");
});

// User Routes
app.post("/login", userController.login);
app.post("/register", userController.register);
app.get("/me", userController.me);
app.post("/logout", userController.logout);

// Forgot Password
app.post("/forgot-password", userController.requestPasswordReset);
app.post("/verify-otp", userController.verifyOtp);
app.post("/reset-password", userController.resetPassword);

// Transaction Routes
app.post("/transaction", transactionController.createTransaction);
app.get("/transaction", transactionController.getTransactions);
app.put("/transaction/:id", transactionController.updateTransaction);
app.delete("/transaction/:id", transactionController.deleteTransaction);

// Notification Routes
app.get("/notifications", notificationController.getNotifications);
app.get("/notifications/unread-count", notificationController.getUnreadCount);
app.put("/notifications/:id/read", notificationController.markAsRead);
app.put("/notifications/mark-all-read", notificationController.markAllAsRead);

// Telegram Webhook Endpoint
app.post("/api/telegram-webhook", (req, res) => {
  telegramBotService.processUpdate(req.body);
  res.sendStatus(200);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Path ${req.originalUrl} not found or method ${req.method} not allowed`,
    error: "Not Found"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message
  });
});

const telegramBotService = require("./services/telegramBotService");

// Start Telegram Bot
telegramBotService.init();

if (require.main === module) {
  server.listen(5000, () => {
    console.log("🚀 Server berjalan di http://localhost:5000");
  });
}

module.exports = app;
