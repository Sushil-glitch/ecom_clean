const Wishlist = require("../models/Wishlist");

// =====================================================
// GET WISHLIST
// =====================================================

const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    }).populate("products");

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      products: wishlist.products,
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADD TO WISHLIST
// =====================================================

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    // Create wishlist if user doesn't have one
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [productId],
      });
    } else {
      // Prevent duplicate products
      if (wishlist.products.some((p) => p.toString() === productId.toString())) {
        return res.status(400).json({
          success: false,
          message: "Product already exists in wishlist",
        });
      }

      wishlist.products.push(productId);

      await wishlist.save();
    }

    const updatedWishlist = await Wishlist.findById(
      wishlist._id
    ).populate("products");

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      products: updatedWishlist.products,
    });
  } catch (error) {
    console.error("ADD WISHLIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// REMOVE FROM WISHLIST
// =====================================================

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(
      wishlist._id
    ).populate("products");

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      products: updatedWishlist.products,
    });
  } catch (error) {
    console.error("REMOVE WISHLIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};