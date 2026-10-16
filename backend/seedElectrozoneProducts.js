const mongoose = require("mongoose");
const path = require("path");
const dns = require("dns");

// Load .env relative to this backend directory
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Ensure Node's c-ares DNS resolver can resolve MongoDB Atlas SRV records on Windows
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.includes("127.0.0.1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch (dnsErr) {
  console.warn("Could not set custom DNS fallback:", dnsErr.message);
}

const Product = require("./models/Product");
const User = require("./models/User");

// Curated ElectroZone sample products matching exact Product schema
const electroZoneProducts = [
  {
    name: "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256GB)",
    category: "Smartphones",
    description: "6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, 200MP Quad Camera with AI features, and integrated S-Pen.",
    price: 119999,
    originalPrice: 134999,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
    stock: 25,
    isActive: true,
  },
  {
    name: "Apple iPhone 15 Pro Max (Natural Titanium, 256GB)",
    category: "Smartphones",
    description: "Aerospace-grade titanium design, A17 Pro chip, customizable Action button, and 48MP main camera with 5x Telephoto optical zoom.",
    price: 139900,
    originalPrice: 159900,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
    stock: 20,
    isActive: true,
  },
  {
    name: "Google Pixel 8 Pro (Obsidian, 128GB)",
    category: "Smartphones",
    description: "Google Tensor G3, immersive 6.7-inch Super Actua display, all-day battery life, and pro-level photography with Best Take and Audio Magic Eraser.",
    price: 79999,
    originalPrice: 89999,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
    stock: 18,
    isActive: true,
  },
  {
    name: "Apple MacBook Pro 16\" (M3 Max, 36GB RAM, 1TB SSD)",
    category: "Laptops & Computers",
    description: "Liquid Retina XDR display, up to 22 hours of battery life, pro connectivity with HDMI and Thunderbolt 4 ports, and industry-leading performance.",
    price: 249900,
    originalPrice: 269900,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    stock: 12,
    isActive: true,
  },
  {
    name: "Dell XPS 15 OLED Touch Laptop (Intel Core i9, 32GB, 1TB)",
    category: "Laptops & Computers",
    description: "15.6-inch 3.5K OLED InfinityEdge touch display, NVIDIA GeForce RTX 4060 graphics, CNC machined aluminum chassis, and immersive sound.",
    price: 164990,
    originalPrice: 184990,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
    stock: 10,
    isActive: true,
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    category: "Audio & Headphones",
    description: "Industry-leading noise cancellation with two processors and 8 microphones, up to 30-hour battery life, and crystal-clear hands-free calling.",
    price: 26990,
    originalPrice: 34990,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    stock: 35,
    isActive: true,
  },
  {
    name: "Apple AirPods Pro (2nd Generation with MagSafe Case USB-C)",
    category: "Audio & Headphones",
    description: "Up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, Personalized Spatial Audio, and precision finding with Find My.",
    price: 20900,
    originalPrice: 24900,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
    stock: 40,
    isActive: true,
  },
  {
    name: "JBL Charge 5 Waterproof Portable Bluetooth Speaker",
    category: "Audio & Headphones",
    description: "Bold JBL Original Pro Sound, dual passive bass radiators, IP67 waterproof and dustproof, with built-in powerbank and 20 hours of playtime.",
    price: 14999,
    originalPrice: 18999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80",
    stock: 30,
    isActive: true,
  },
  {
    name: "Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium)",
    category: "Wearables & Smart Home",
    description: "Rugged corrosion-resistant titanium case, bright 3000-nit Always-On Retina display, dual-frequency precision GPS, and up to 36 hours of battery.",
    price: 79900,
    originalPrice: 89900,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
    stock: 15,
    isActive: true,
  },
  {
    name: "Samsung 55\" Neo QLED 4K Smart TV",
    category: "Wearables & Smart Home",
    description: "Quantum Matrix Technology with Mini LEDs, Neural Quantum Processor 4K, Dolby Atmos audio, and ultra-slim bezel-less design.",
    price: 84990,
    originalPrice: 109990,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80",
    stock: 8,
    isActive: true,
  },
  {
    name: "Sony PlayStation 5 Slim Digital Console",
    category: "Gaming Gear",
    description: "Slim design with 1TB SSD storage, lightning-fast loading with ultra-high speed SSD, deeper immersion with haptic feedback, and 4K-TV gaming.",
    price: 44990,
    originalPrice: 54990,
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
    stock: 14,
    isActive: true,
  },
  {
    name: "Logitech MX Master 3S Wireless Performance Mouse",
    category: "Gaming Gear",
    description: "Quiet Click technology, 8000 DPI track-on-glass sensor, MagSpeed electromagnetic scrolling, and ergonomic comfortable hand-sculpted design.",
    price: 8995,
    originalPrice: 10995,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    stock: 50,
    isActive: true,
  },
];

async function seedElectroZone() {
  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing from your .env file!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    const dbName = mongoose.connection.name;
    console.log(`Connected successfully to database: "${dbName}"`);
    console.log(`Target Collection: "products"`);
    console.log(`Mode: SAFE ADDITIVE (Non-destructive - existing records preserved)\n`);

    // Find any existing admin user to associate with createdBy (optional)
    const adminUser = await User.findOne({ role: "admin" }) || await User.findOne({});
    const creatorId = adminUser ? adminUser._id : null;

    let addedCount = 0;
    let skippedCount = 0;

    for (const prod of electroZoneProducts) {
      // Check duplicate by unique product name
      const existing = await Product.findOne({ name: prod.name });

      if (existing) {
        console.log(`- [SKIP] Already exists: "${prod.name}" (Price: ₹${existing.price})`);
        skippedCount++;
      } else {
        await Product.create({
          ...prod,
          createdBy: creatorId,
        });
        console.log(`+ [ADDED] Seeded: "${prod.name}" - ₹${prod.price} [${prod.category}]`);
        addedCount++;
      }
    }

    const totalInDb = await Product.countDocuments();
    const activeInDb = await Product.countDocuments({ isActive: true });

    console.log("\n=================================================");
    console.log(`SEEDING COMPLETED SUMMARY:`);
    console.log(`- New products inserted : ${addedCount}`);
    console.log(`- Existing skipped      : ${skippedCount}`);
    console.log(`- Total products in DB  : ${totalInDb}`);
    console.log(`- Active products in DB : ${activeInDb}`);
    console.log("=================================================");

    await mongoose.connection.close();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Execute when run directly
if (require.main === module) {
  seedElectroZone();
}

module.exports = { seedElectroZone, electroZoneProducts };
