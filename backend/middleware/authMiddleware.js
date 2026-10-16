const jwt = require("jsonwebtoken");

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};

// =====================================================
// OPTIONAL AUTH MIDDLEWARE
// =====================================================

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.id,
          _id: decoded.id,
          role: decoded.role,
        };
      }
    }
  } catch (err) {
    // Ignore invalid optional token
  }
  next();
};

// =====================================================
// ADMIN ONLY
// =====================================================

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminOnly,
};