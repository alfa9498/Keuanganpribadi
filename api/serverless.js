const app = require("../Backend/server");

// Vercel serverless function entry point
module.exports = (req, res) => {
  // Log for debugging
  console.log(`API Request: ${req.method} ${req.url}`);
  app(req, res);
};
