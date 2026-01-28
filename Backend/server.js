const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const userController = require("./controllers/userController");
const transactionController = require("./controllers/transactionController");
const notificationController = require("./controllers/notificationController");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Vercel deployment
    const isAllowed = [
      "http://localhost:5173",
      process.env.FRONTEND_URL,
      process.env.WEBHOOK_URL
    ].some(allowed => allowed && origin === allowed);

    if (isAllowed || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
};

const isVercel = process.env.VERCEL === '1';
let io;

if (!isVercel) {
  io = new Server(server, {
    cors: corsOptions
  });
  // Make io accessible globally
  global.io = io;
  console.log("ℹ️ Socket.IO initialized (Local Mode)");
} else {
  console.log("ℹ️ Socket.IO disabled (Vercel Serverless Mode)");
  global.io = { emit: () => {} }; // Mock io to prevent crashes in services
}

app.use(cors(corsOptions));

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
  const errorDetails = {
    message: err.message,
    stack: isVercel ? undefined : err.stack, // Don't expose stack in prod but good for debugging if needed
    path: req.path,
    method: req.method
  };
  
  console.error("❌ Global Error Handler Triggered:");
  console.error(err);
  
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
    details: isVercel ? "Check Vercel Runtime Logs for full stack trace" : err.stack
  });
});

const telegramBotService = require("./services/telegramBotService");

// Start Telegram Bot
try {
  telegramBotService.init();
} catch (error) {
  console.error("⚠️ Failed to initialize Telegram Bot:", error.message);
}


if (require.main === module) {
  server.listen(5000, () => {
    console.log("🚀 Server berjalan di http://localhost:5000");
  });
}

module.exports = app;
