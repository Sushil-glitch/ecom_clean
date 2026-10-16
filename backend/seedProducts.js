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

const sampleProducts = [
  // ==========================================
  // 📚 10 BOOKS
  // ==========================================
  {
    name: "Atomic Habits by James Clear",
    category: "Books",
    description: "An easy & proven way to build good habits & break bad ones. Learn how small changes deliver remarkable results.",
    price: 499,
    originalPrice: 799,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    stock: 45,
    isActive: true,
  },
  {
    name: "The Psychology of Money",
    category: "Books",
    description: "Timeless lessons on wealth, greed, and happiness by Morgan Housel. Essential reading for financial freedom.",
    price: 299,
    originalPrice: 499,
    image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80",
    stock: 30,
    isActive: true,
  },
  {
    name: "Rich Dad Poor Dad by Robert Kiyosaki",
    category: "Books",
    description: "What the rich teach their kids about money that the poor and middle class do not!",
    price: 349,
    originalPrice: 599,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    stock: 25,
    isActive: true,
  },
  {
    name: "Deep Work: Rules for Focused Success",
    category: "Books",
    description: "Cal Newport provides actionable rules for focused success in a distracted digital world.",
    price: 449,
    originalPrice: 699,
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    stock: 22,
    isActive: true,
  },
  {
    name: "Clean Code: Handbook of Software Craftsmanship",
    category: "Books",
    description: "Robert C. Martin's legendary guide on writing readable, maintainable, and robust code.",
    price: 899,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80",
    stock: 18,
    isActive: true,
  },
  {
    name: "The Pragmatic Programmer",
    category: "Books",
    description: "Your journey to mastery in modern software development by David Thomas & Andrew Hunt.",
    price: 999,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    stock: 25,
    isActive: true,
  },
  {
    name: "Sapiens: A Brief History of Humankind",
    category: "Books",
    description: "Yuval Noah Harari explores how Homo sapiens conquered Earth and shaped modern civilization.",
    price: 549,
    originalPrice: 899,
    image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80",
    stock: 40,
    isActive: true,
  },
  {
    name: "Thinking, Fast and Slow by Daniel Kahneman",
    category: "Books",
    description: "Nobel laureate Daniel Kahneman explains the two systems that drive the way we think and make choices.",
    price: 479,
    originalPrice: 799,
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80",
    stock: 20,
    isActive: true,
  },
  {
    name: "Zero to One: Notes on Startups",
    category: "Books",
    description: "Peter Thiel shows how to build companies that create new things and shape the future.",
    price: 379,
    originalPrice: 599,
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80",
    stock: 35,
    isActive: true,
  },
  {
    name: "The Alchemist by Paulo Coelho",
    category: "Books",
    description: "An inspiring fable about following your dreams, listening to your heart, and reading life's omens.",
    price: 249,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
    stock: 50,
    isActive: true,
  },

  // ==========================================
  // 📺 10 ELECTRONICS
  // ==========================================
  {
    name: "Sony Bravia 55\" 4K Ultra HD Smart TV",
    category: "Electronics",
    description: "Google TV with Dolby Vision HDR, X1 4K Processor, and Dolby Atmos cinematic sound.",
    price: 52990,
    originalPrice: 74990,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
    stock: 12,
    isActive: true,
  },
  {
    name: "LG 1.5 Ton 5 Star Dual Inverter Split AC",
    category: "Electronics",
    description: "AI Convertible 6-in-1 cooling, 100% copper condenser, HD filter with anti-virus protection.",
    price: 41990,
    originalPrice: 58990,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    stock: 8,
    isActive: true,
  },
  {
    name: "Samsung 345L Double Door Refrigerator",
    category: "Electronics",
    description: "Digital Inverter Compressor, Twin Cooling Plus, and Smart Connect inverter backup.",
    price: 36990,
    originalPrice: 48900,
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&auto=format&fit=crop&q=80",
    stock: 0,
    isActive: true,
  },
  {
    name: "Bosch 8 kg 5 Star Front Load Washer",
    category: "Electronics",
    description: "EcoSilence Drive motor, 1400 RPM spin speed, Anti-Tangle and AllergyPlus steam wash.",
    price: 34990,
    originalPrice: 46990,
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
    stock: 10,
    isActive: true,
  },
  {
    name: "Philips Digital Air Fryer XL 6.2L",
    category: "Electronics",
    description: "Rapid Air Technology, 90% less fat cooking, touch screen display with 7 preset menus.",
    price: 9990,
    originalPrice: 15995,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
    stock: 25,
    isActive: true,
  },
  {
    name: "Marshall Stanmore III Bluetooth Speaker",
    category: "Electronics",
    description: "Iconic vintage home speaker with room-filling stereo sound, dynamic loudness, and RCA input.",
    price: 31999,
    originalPrice: 39999,
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    stock: 14,
    isActive: true,
  },
  {
    name: "Bose QuietComfort 45 ANC Headphones",
    category: "Electronics",
    description: "World-class active noise cancelling over-ear headphones with Quiet and Aware modes.",
    price: 24900,
    originalPrice: 32900,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
    stock: 0,
    isActive: true,
  },
  {
    name: "Whirlpool 30L Convection Microwave",
    category: "Electronics",
    description: "Pre-set auto cook menus, zero oil cooking mode, stainless steel cavity, and motorized rotisserie.",
    price: 13490,
    originalPrice: 18900,
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80",
    stock: 19,
    isActive: true,
  },
  {
    name: "Canon EOS R6 Mark II Mirrorless Camera",
    category: "Electronics",
    description: "24.2 MP full-frame CMOS sensor, 4K 60p uncropped video, Dual Pixel CMOS AF II.",
    price: 214990,
    originalPrice: 243995,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    stock: 5,
    isActive: true,
  },
  {
    name: "Dyson V11 Cordless Vacuum Cleaner",
    category: "Electronics",
    description: "Intelligent suction power optimization, LCD screen, 60 minutes run time, HEPA filtration.",
    price: 45900,
    originalPrice: 55900,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
    stock: 7,
    isActive: true,
  },

  // ==========================================
  // ⌚ 10 GADGETS
  // ==========================================
  {
    name: "Apple Watch Series 9 GPS 45mm",
    category: "Gadgets",
    description: "S9 SiP chip, Double Tap gesture control, brighter Retina display, health & ECG sensors.",
    price: 37900,
    originalPrice: 44900,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    stock: 15,
    isActive: true,
  },
  {
    name: "Apple AirPods Pro (2nd Gen) USB-C",
    category: "Gadgets",
    description: "H2 chip powered active noise cancellation, adaptive audio, spatial audio, and MagSafe case.",
    price: 20900,
    originalPrice: 24900,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    stock: 30,
    isActive: true,
  },
  {
    name: "Samsung Galaxy Tab S9 Ultra 14.6\"",
    category: "Gadgets",
    description: "Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, bundled S Pen, IP68 water resistance.",
    price: 92999,
    originalPrice: 108999,
    image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80",
    stock: 15,
    isActive: true,
  },
  {
    name: "Anker PowerCore 24000mAh 140W Bank",
    category: "Gadgets",
    description: "Ultra-powerful 3-port portable charger with smart digital display and 140W fast output.",
    price: 9999,
    originalPrice: 14999,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    stock: 45,
    isActive: true,
  },
  {
    name: "Logitech MX Master 3S Wireless Mouse",
    category: "Gadgets",
    description: "8K DPI track-on-glass sensor, quiet click switches, MagSpeed electromagnetic scrolling.",
    price: 8495,
    originalPrice: 10995,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    stock: 28,
    isActive: true,
  },
  {
    name: "Keychron K2 V2 Mechanical Keyboard",
    category: "Gadgets",
    description: "75% layout bluetooth mechanical keyboard with Gateron G Pro switches and RGB backlight.",
    price: 7499,
    originalPrice: 9999,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    stock: 20,
    isActive: true,
  },
  {
    name: "DJI Mini 4 Pro Fly More Combo Drone",
    category: "Gadgets",
    description: "Under 249g foldable drone with 4K/60fps HDR video, omnidirectional obstacle sensing.",
    price: 94990,
    originalPrice: 112000,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80",
    stock: 6,
    isActive: true,
  },
  {
    name: "Steam Deck OLED 512GB Handheld Console",
    category: "Gadgets",
    description: "90Hz HDR OLED display, faster Wi-Fi 6E, custom AMD APU for AAA PC gaming anywhere.",
    price: 54999,
    originalPrice: 64999,
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=600&auto=format&fit=crop&q=80",
    stock: 0,
    isActive: true,
  },
  {
    name: "Fitbit Charge 6 Fitness Tracker",
    category: "Gadgets",
    description: "Built-in GPS, 40+ exercise modes, ECG app, YouTube Music controls, and Google Maps.",
    price: 11999,
    originalPrice: 14999,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    stock: 32,
    isActive: true,
  },
  {
    name: "Kindle Paperwhite 16GB 6.8\" Display",
    category: "Gadgets",
    description: "300 ppi glare-free display, adjustable warm light, IPX8 waterproof, 10 weeks battery life.",
    price: 11499,
    originalPrice: 14999,
    image: "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80",
    stock: 40,
    isActive: true,
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("ERROR: MONGO_URI is missing from your .env file!");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully to " + mongoose.connection.name + " for seeding categories.");

    const adminUser = (await User.findOne({ role: "admin" })) || (await User.findOne({}));
    const adminId = adminUser ? adminUser._id : null;

    let addedCount = 0;

    for (const prod of sampleProducts) {
      const existing = await Product.findOne({ name: prod.name });
      if (!existing) {
        await Product.create({
          ...prod,
          createdBy: adminId,
        });
        addedCount++;
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

    console.log(`Successfully seeded 30 products! (10 Books, 10 Electronics, 10 Gadgets). (${addedCount} new added)`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

seed();
