const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  seedSampleProducts,
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/productController");

const {
  authMiddleware,
  adminOnly,
} = require("../middleware/authMiddleware");

// =====================================================
// CATEGORIES ROUTES (Public & Admin)
// =====================================================

router.get("/categories", getCategories);
router.post("/categories", authMiddleware, adminOnly, createCategory);
router.delete("/categories/:id", authMiddleware, adminOnly, deleteCategory);

// =====================================================
// ADMIN - SEED SAMPLE PRODUCTS
// =====================================================

router.post(
  "/seed",
  authMiddleware,
  adminOnly,
  seedSampleProducts
);

// =====================================================
// ADMIN - GET ALL PRODUCTS
// IMPORTANT: keep this BEFORE /:id
// =====================================================

router.get(
  "/admin/all",
  authMiddleware,
  adminOnly,
  getAdminProducts
);

// =====================================================
// CLIENT - GET PRODUCTS
// =====================================================

router.get("/", getProducts);

// =====================================================
// ADMIN - CREATE PRODUCT
// =====================================================

router.post(
  "/",
  authMiddleware,
  adminOnly,
  createProduct
);

// =====================================================
// ADMIN - UPDATE PRODUCT
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  updateProduct
);

// =====================================================
// ADMIN - DELETE PRODUCT
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminOnly,
  deleteProduct
);

// =====================================================
// GET SINGLE PRODUCT
// =====================================================

router.get(
  "/:id",
  getProductById
);

module.exports = router;