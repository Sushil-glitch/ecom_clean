const mongoose = require("mongoose");
const Product = require("../models/Product");

// =====================================================
// CREATE PRODUCT - ADMIN ONLY
// =====================================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      originalPrice,
      image,
      stock,
      isActive,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!name || !category || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category, description and price are required",
      });
    }

    if (Number(price) < 0 || Number(originalPrice || 0) < 0 || Number(stock || 0) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price, original price and stock cannot be negative values",
      });
    }

    // -------------------------------------------------
    // CREATE PRODUCT
    // -------------------------------------------------

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: Number(originalPrice || 0),
      image: image || "",
      stock: Number(stock || 0),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// GET ACTIVE PRODUCTS - CLIENT
// =====================================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// GET ALL PRODUCTS - ADMIN
// =====================================================

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET ADMIN PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// GET SINGLE PRODUCT
// =====================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE PRODUCT - ADMIN ONLY
// =====================================================

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let product = null;
    if (id && id !== "undefined" && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product && req.body?.name) {
      product = await Product.findOne({ name: req.body.name });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // -------------------------------------------------
    // FIELDS ADMIN IS ALLOWED TO UPDATE
    // -------------------------------------------------

    const allowedFields = [
      "name",
      "category",
      "description",
      "price",
      "originalPrice",
      "image",
      "stock",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (
      (product.price !== undefined && Number(product.price) < 0) ||
      (product.originalPrice !== undefined && Number(product.originalPrice) < 0) ||
      (product.stock !== undefined && Number(product.stock) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price, original price and stock cannot be negative values",
      });
    }

    if (req.user?.id && !product.createdBy) {
      product.createdBy = req.user.id;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating product",
    });
  }
};

// =====================================================
// DELETE PRODUCT - ADMIN ONLY (SOFT DELETE)
// =====================================================

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let product = null;
    if (id && id !== "undefined" && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Soft delete to preserve historical order references
    product.isActive = false;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// SEED SAMPLE PRODUCTS - ADMIN ONLY
// =====================================================

const seedSampleProducts = async (req, res) => {
  try {
    const sampleProducts = [
      // 10 HD SMARTPHONES
      {
        name: "Samsung Galaxy S25 Ultra 5G",
        category: "Smartphones",
        description: "6.9-inch Dynamic AMOLED 2X 120Hz display, Snapdragon 8 Elite, 200MP Quad Camera with S-Pen.",
        price: 129999,
        originalPrice: 144999,
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
        stock: 15,
        isActive: true,
      },
      {
        name: "Apple iPhone 16 Pro Max",
        category: "Smartphones",
        description: "Super Retina XDR display with ProMotion, A18 Pro chip, 48MP Fusion camera system with 5x Telephoto zoom.",
        price: 144999,
        originalPrice: 159999,
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
        stock: 18,
        isActive: true,
      },
      {
        name: "Google Pixel 9 Pro XL",
        category: "Smartphones",
        description: "Tensor G4 chip with Gemini AI features, Super Actua display, pro triple camera system with 30x Super Res Zoom.",
        price: 109999,
        originalPrice: 124999,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
        stock: 12,
        isActive: true,
      },
      {
        name: "OnePlus 13 5G",
        category: "Smartphones",
        description: "6.82-inch 2K 120Hz AMOLED display, Snapdragon 8 Elite, 50MP Hasselblad camera, 6000mAh battery with 100W charging.",
        price: 69999,
        originalPrice: 79999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
        stock: 25,
        isActive: true,
      },
      {
        name: "Xiaomi 15 Ultra 5G",
        category: "Smartphones",
        description: "Leica Quad Camera system with 1-inch sensor, 2K AMOLED display, 90W HyperCharge fast wireless charging.",
        price: 99999,
        originalPrice: 109999,
        image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80",
        stock: 10,
        isActive: true,
      },
      {
        name: "Nothing Phone (2a) Plus",
        category: "Smartphones",
        description: "Transparent Glyph Interface design, MediaTek Dimensity 7350 Pro 5G, 50MP dual camera, 120Hz AMOLED display.",
        price: 27999,
        originalPrice: 33999,
        image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80",
        stock: 30,
        isActive: true,
      },
      {
        name: "Samsung Galaxy Z Fold 6 5G",
        category: "Smartphones",
        description: "Foldable 7.6-inch Dynamic AMOLED main display, Armor Aluminum frame, IP48 water resistance and Galaxy AI.",
        price: 164999,
        originalPrice: 184999,
        image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&auto=format&fit=crop&q=80",
        stock: 8,
        isActive: true,
      },
      {
        name: "Motorola Edge 50 Ultra",
        category: "Smartphones",
        description: "Real wooden back cover, Pantone validated 1.5K 144Hz pOLED display, Snapdragon 8s Gen 3, 125W TurboPower.",
        price: 54999,
        originalPrice: 64999,
        image: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&auto=format&fit=crop&q=80",
        stock: 20,
        isActive: true,
      },
      {
        name: "iQOO 13 5G Gaming Phone",
        category: "Smartphones",
        description: "Q2 dedicated gaming chip, 2K 144Hz LTPO AMOLED display, Monster Touch shoulder triggers, 120W FlashCharge.",
        price: 54999,
        originalPrice: 62999,
        image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&auto=format&fit=crop&q=80",
        stock: 22,
        isActive: true,
      },
      {
        name: "Vivo X100 Pro 5G",
        category: "Smartphones",
        description: "ZEISS APO Floating Telephoto camera, Dimensity 9300 chipset, V3 imaging chip, IP68 dust & water resistance.",
        price: 89999,
        originalPrice: 99999,
        image: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&auto=format&fit=crop&q=80",
        stock: 14,
        isActive: true,
      },
      {
        name: "Smart Watch Ultra 2",
        category: "Gadgets",
        description: "Premium AMOLED smartwatch with heart rate, SpO2, GPS tracking, and 7-day battery life.",
        price: 2999,
        originalPrice: 4999,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        stock: 25,
        isActive: true,
      },
      {
        name: "Pro Wireless Bluetooth Earbuds",
        category: "Gadgets",
        description: "Active noise cancelling wireless earbuds with deep bass and IPX5 water resistance.",
        price: 1499,
        originalPrice: 2999,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
        stock: 40,
        isActive: true,
      },
      {
        name: "20000mAh Fast Charging Power Bank",
        category: "Gadgets",
        description: "High capacity portable charger with dual USB-C 22.5W fast output and LED display.",
        price: 1299,
        originalPrice: 1999,
        image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
        stock: 30,
        isActive: true,
      },
      {
        name: "4K Ultra VR Gaming Headset",
        category: "Gadgets",
        description: "Next-gen immersive virtual reality headset with 3D spatial audio and motion controllers.",
        price: 14999,
        originalPrice: 19999,
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=600&auto=format&fit=crop&q=80",
        stock: 12,
        isActive: true,
      },
      {
        name: "Smart Fitness Tracker Band",
        category: "Gadgets",
        description: "Lightweight health band with sleep monitor, step counter, and smart notifications.",
        price: 999,
        originalPrice: 1799,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
        stock: 50,
        isActive: true,
      },
      {
        name: "Noise Cancelling Over-Ear Headphones",
        category: "Gadgets",
        description: "Over-ear wireless headphones with studio-quality audio driver and soft memory cushions.",
        price: 4500,
        originalPrice: 6999,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        stock: 18,
        isActive: true,
      },
      {
        name: "Clean Code: Handbook of Software Craftsmanship",
        category: "Books",
        description: "Essential guide by Robert C. Martin on writing readable, maintainable, and refactored code.",
        price: 599,
        originalPrice: 899,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80",
        stock: 35,
        isActive: true,
      },
      {
        name: "JavaScript: The Good Parts",
        category: "Books",
        description: "Douglas Crockford's classic masterpiece covering core JavaScript syntax and patterns.",
        price: 449,
        originalPrice: 699,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        stock: 20,
        isActive: true,
      },
      {
        name: "Atomic Habits by James Clear",
        category: "Books",
        description: "A proven framework for building good habits and breaking bad ones every single day.",
        price: 399,
        originalPrice: 599,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
        stock: 60,
        isActive: true,
      },
      {
        name: "Designing Data-Intensive Applications",
        category: "Books",
        description: "Martin Kleppmann's authoritative book on distributed systems, databases, and scalability.",
        price: 899,
        originalPrice: 1299,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
        stock: 15,
        isActive: true,
      },
      {
        name: "The Pragmatic Programmer",
        category: "Books",
        description: "Your journey to mastery in software development by David Thomas and Andrew Hunt.",
        price: 699,
        originalPrice: 999,
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        stock: 28,
        isActive: true,
      },
      {
        name: "You Don't Know JS Yet: Scope & Closures",
        category: "Books",
        description: "Deep dive into JavaScript mechanics, lexical scope, hoisting, and closures by Kyle Simpson.",
        price: 499,
        originalPrice: 799,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80",
        stock: 22,
        isActive: true,
      },
      {
        name: "55\" Ultra HD 4K Smart Android TV",
        category: "Electronics",
        description: "Vibrant Dolby Vision HDR display with built-in Chromecast, Google Assistant, and Surround Sound.",
        price: 32999,
        originalPrice: 45999,
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
        stock: 10,
        isActive: true,
      },
      {
        name: "Smart Home AI Voice Speaker",
        category: "Electronics",
        description: "Voice-controlled smart speaker with rich bass, music streaming, and smart device control.",
        price: 2499,
        originalPrice: 3999,
        image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&auto=format&fit=crop&q=80",
        stock: 30,
        isActive: true,
      },
      {
        name: "Mirrorless 4K Digital Camera Lens Kit",
        category: "Electronics",
        description: "24.2 MP sensor with eye auto-focus, 4K 60fps video recording, and interchangeable lens.",
        price: 48999,
        originalPrice: 59999,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
        stock: 8,
        isActive: true,
      },
      {
        name: "Wireless Outdoor Smart Security Camera",
        category: "Electronics",
        description: "1080p Full HD night vision camera with motion detection alerts and two-way talk.",
        price: 3499,
        originalPrice: 4999,
        image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&auto=format&fit=crop&q=80",
        stock: 25,
        isActive: true,
      },
      {
        name: "Waterproof Portable Bluetooth Speaker",
        category: "Electronics",
        description: "IPX7 waterproof rating, 360-degree stereo sound, and 12-hour continuous playtime.",
        price: 1999,
        originalPrice: 3499,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
        stock: 35,
        isActive: true,
      },
      {
        name: "10.9\" High Performance Digital Tablet",
        category: "Electronics",
        description: "Ultra-fast octa-core processor, Retina display, stylus support, and 128GB storage.",
        price: 26999,
        originalPrice: 31999,
        image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80",
        stock: 14,
        isActive: true,
      },
      {
        name: "RGB Mechanical Gaming Keyboard",
        category: "Computer Accessories",
        description: "Tactile blue switches, per-key RGB backlighting, aircraft-grade aluminum top plate.",
        price: 2799,
        originalPrice: 4499,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
        stock: 30,
        isActive: true,
      },
      {
        name: "Ergonomic Wireless Optical Mouse",
        category: "Computer Accessories",
        description: "High precision 2400 DPI optical sensor, comfortable thumb rest, and silent click switches.",
        price: 899,
        originalPrice: 1499,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
        stock: 45,
        isActive: true,
      },
      {
        name: "34\" Curved UltraWide 4K Gaming Monitor",
        category: "Computer Accessories",
        description: "144Hz refresh rate, 1ms response time, HDR400, AMD FreeSync Premium display.",
        price: 29999,
        originalPrice: 38999,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
        stock: 7,
        isActive: true,
      },
      {
        name: "USB-C 8-in-1 Aluminum Docking Hub",
        category: "Computer Accessories",
        description: "4K HDMI, 100W PD charging, SD/TF card reader, 3x USB 3.0 ports, Gigabit Ethernet.",
        price: 1899,
        originalPrice: 2999,
        image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80",
        stock: 40,
        isActive: true,
      },
      {
        name: "Full HD 1080p Streaming Webcam",
        category: "Computer Accessories",
        description: "Dual noise-reducing microphones, automatic low-light correction, privacy shutter.",
        price: 1599,
        originalPrice: 2499,
        image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&auto=format&fit=crop&q=80",
        stock: 22,
        isActive: true,
      },
      {
        name: "Extended XL RGB Gaming Mousepad",
        category: "Computer Accessories",
        description: "Anti-fray stitched edges, non-slip rubber base, 14 lighting modes for desk setups.",
        price: 699,
        originalPrice: 1199,
        image: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=600&auto=format&fit=crop&q=80",
        stock: 50,
        isActive: true,
      },
    ];

    let count = 0;
    for (const prod of sampleProducts) {
      const existing = await Product.findOne({ name: prod.name });
      if (!existing) {
        await Product.create({
          ...prod,
          createdBy: req.user.id,
        });
        count++;
      } else {
        existing.image = prod.image;
        existing.category = prod.category;
        existing.price = prod.price;
        existing.originalPrice = prod.originalPrice;
        existing.description = prod.description;
        existing.stock = prod.stock;
        existing.isActive = true;
        await existing.save();
      }
    }

    const hdImages = [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80",
    ];

    // Auto-fix empty images for any existing products
    const allProds = await Product.find();
    let imgIdx = 0;
    for (const p of allProds) {
      if (!p.image || !p.image.trim() || p.image.includes("placeholder")) {
        p.image = hdImages[imgIdx % hdImages.length];
        imgIdx++;
        await p.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sample live products seeded & HD images assigned! (${count} new smartphones added)`,
    });
  } catch (error) {
    console.error("SEED PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to seed sample products",
    });
  }
};

// =====================================================
// GET CATEGORIES
// =====================================================

const Category = require("../models/Category");

const getCategories = async (req, res) => {
  try {
    const defaultList = ["Electronics", "Books", "Gadgets", "Computer Accessories"];

    // 1. Custom DB categories
    const dbCategories = await Category.find().sort({ name: 1 });
    const customNames = dbCategories.map((c) => c.name);

    // 2. Distinct product categories
    const productCategories = await Product.distinct("category");

    // 3. Combine all unique names
    const allNames = Array.from(
      new Set([...defaultList, ...customNames, ...productCategories.filter(Boolean)])
    );

    // 4. Calculate product counts for each category
    const categoriesWithCount = await Promise.all(
      allNames.map(async (catName) => {
        const count = await Product.countDocuments({ category: catName });
        const foundCustom = dbCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        return {
          _id: foundCustom?._id || `cat-${catName}`,
          name: catName,
          description: foundCustom?.description || `${catName} products & tech gear`,
          icon: foundCustom?.icon || "Package",
          image: foundCustom?.image || "",
          productCount: count,
          isCustom: Boolean(foundCustom),
        };
      })
    );

    return res.status(200).json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching categories",
    });
  }
};

// =====================================================
// CREATE CATEGORY - ADMIN ONLY
// =====================================================

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    // Check if category exists
    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (category) {
      return res.status(400).json({
        success: false,
        message: `Category "${trimmedName}" already exists!`,
      });
    }

    category = await Category.create({
      name: trimmedName,
      description: description ? description.trim() : `${trimmedName} products & accessories`,
      icon: icon || "Package",
      image: image || "",
    });

    return res.status(201).json({
      success: true,
      message: `Category "${trimmedName}" created successfully!`,
      category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating category",
    });
  }
};

// =====================================================
// DELETE CATEGORY - ADMIN ONLY
// =====================================================

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Category.findByIdAndDelete(id);
    } else {
      // Delete by name if id is a name string
      await Category.findOneAndDelete({ name: id });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting category",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
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
};