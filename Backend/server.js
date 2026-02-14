const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const userController = require("./controllers/userController");
const transactionController = require("./controllers/transactionController");
const notificationController = require("./controllers/notificationController");
const telegramBotService = require("./services/telegramBotService");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: function (origin, callback) {
    // For development, allow localhost ports 5173 and 5174
    const devOrigins = ["http://localhost:5173", "http://localhost:5174"];

    if (
      !origin ||
      devOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"],
};

const isVercel = process.env.VERCEL === "1";
let io;

if (!isVercel) {
  io = new Server(server, {
    cors: corsOptions,
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

// Verify Env Secrets
if (process.env.VERCEL === "1" && !process.env.JWT_SECRET) {
  console.warn("⚠️ WARNING: JWT_SECRET is not set in environment variables!");
}

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0)
    console.log("Body:", req.body);
  next();
});

// Test Endpoint
app.get("/api/ping", (req, res) => {
  console.log("🏓 PING RECEIVED - Server is working!");
  res.send("PONG");
});

// User Routes
app.post("/api/login", userController.login);
app.post("/api/register", userController.register);
app.get("/api/me", userController.me);
app.post("/api/logout", userController.logout);
app.get("/api/telegram-link", userController.generateTelegramLink);
app.get(
  "/api/telegram-verification-code",
  userController.generateVerificationCode,
);

// Forgot Password
app.post("/api/forgot-password", userController.requestPasswordReset);
app.post("/api/verify-otp", userController.verifyOtp);
app.post("/api/reset-password", userController.resetPassword);

// Transaction Routes
app.post("/api/transaction", transactionController.createTransaction);
app.get("/api/transaction", transactionController.getTransactions);
app.put("/api/transaction/:id", transactionController.updateTransaction);
app.delete("/api/transaction/:id", transactionController.deleteTransaction);

// Notification Routes
app.get("/api/notifications", notificationController.getNotifications);
app.get(
  "/api/notifications/unread-count",
  notificationController.getUnreadCount,
);
app.put("/api/notifications/:id/read", notificationController.markAsRead);
app.put(
  "/api/notifications/mark-all-read",
  notificationController.markAllAsRead,
);

// Account Routes
const accountRoutes = require("./routes/accountRoutes");
app.use("/api/accounts", accountRoutes);

// Category Routes
const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);

// Planning Routes
const planningRoutes = require("./routes/planningRoutes");
app.use("/api", planningRoutes);

// Telegram Webhook Endpoint
// IMPORTANT: Webhook URL set in Telegram must match this route
app.post("/api/telegram-webhook", (req, res) => {
  console.log("📥 WEBHOOK POST RECEIVED ON /api/telegram-webhook");
  telegramBotService.processUpdate(req.body);
  res.sendStatus(200);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Path ${req.originalUrl} not found or method ${req.method} not allowed`,
    error: "Not Found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: isVercel ? undefined : err.stack, // Don't expose stack in prod but good for debugging if needed
    path: req.path,
    method: req.method,
  };

  console.error("❌ Global Error Handler Triggered:");
  console.error(err);

  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
    details: isVercel
      ? "Check Vercel Runtime Logs for full stack trace"
      : err.stack,
  });
});

// Start Telegram Bot
try {
  // We'll call init manually or let processUpdate do it
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
