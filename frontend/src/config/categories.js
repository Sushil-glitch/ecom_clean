import {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Keyboard,
  Tv,
  Sparkles,
} from "lucide-react";

export const STORE_CATEGORIES = [
  {
    name: "Smartphones & Tablets",
    slug: "smartphones",
    icon: Smartphone,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentGradient: "from-emerald-500 to-teal-600",
    description: "Flagship 5G smartphones, tablets and high-speed mobile connectivity gear.",
  },
  {
    name: "Laptops & Computers",
    slug: "laptops",
    icon: Laptop,
    color: "bg-blue-50 text-blue-700 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    accentGradient: "from-blue-500 to-indigo-600",
    description: "High-performance laptops, ultrabooks, and workstations for developers and creators.",
  },
  {
    name: "Audio & Headphones",
    slug: "audio",
    icon: Headphones,
    color: "bg-purple-50 text-purple-700 border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    accentGradient: "from-purple-500 to-pink-600",
    description: "Active noise-cancelling headphones, true wireless earbuds and studio monitors.",
  },
  {
    name: "Wearables & Smartwatches",
    slug: "wearables",
    icon: Watch,
    color: "bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    accentGradient: "from-amber-500 to-orange-600",
    description: "Smart fitness trackers, titanium smartwatches, and advanced health sensors.",
  },
  {
    name: "Gaming Gear",
    slug: "gaming",
    icon: Gamepad2,
    color: "bg-rose-50 text-rose-700 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    accentGradient: "from-rose-500 to-red-600",
    description: "Next-gen consoles, handheld gaming systems, controllers, and low-latency gear.",
  },
  {
    name: "Computer Accessories",
    slug: "accessories",
    icon: Keyboard,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    accentGradient: "from-indigo-500 to-violet-600",
    description: "Mechanical keyboards, ergonomic mice, docking stations, and 4K webcams.",
  },
  {
    name: "TV & Home Entertainment",
    slug: "entertainment",
    icon: Tv,
    color: "bg-cyan-50 text-cyan-700 border-cyan-200/80 group-hover:bg-cyan-600 group-hover:text-white",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    accentGradient: "from-cyan-500 to-blue-600",
    description: "4K OLED Smart TVs, immersive Dolby Atmos soundbars, and smart home appliances.",
  },
];

export const getCategoryMetadata = (categoryName) => {
  if (!categoryName) {
    return {
      icon: Sparkles,
      color: "bg-slate-50 text-slate-700 border-slate-200 group-hover:bg-blue-600 group-hover:text-white",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
      accentGradient: "from-blue-500 to-indigo-600",
      desc: "Top quality products and accessories curated for you.",
    };
  }

  const nameLower = categoryName.toLowerCase().trim();
  const found = STORE_CATEGORIES.find((cat) => {
    const cLower = cat.name.toLowerCase();
    return cLower.includes(nameLower) || nameLower.includes(cLower) || cat.slug === nameLower;
  });

  if (found) {
    return {
      icon: found.icon,
      color: found.color,
      badgeColor: found.badgeColor,
      accentGradient: found.accentGradient,
      desc: found.description,
    };
  }

  // Fallbacks by keywords
  if (nameLower.includes("phone") || nameLower.includes("mobile")) return STORE_CATEGORIES[0];
  if (nameLower.includes("laptop") || nameLower.includes("pc")) return STORE_CATEGORIES[1];
  if (nameLower.includes("audio") || nameLower.includes("sound") || nameLower.includes("headphone")) return STORE_CATEGORIES[2];
  if (nameLower.includes("watch") || nameLower.includes("wear")) return STORE_CATEGORIES[3];
  if (nameLower.includes("game") || nameLower.includes("deck") || nameLower.includes("playstation")) return STORE_CATEGORIES[4];
  if (nameLower.includes("access") || nameLower.includes("keyboard") || nameLower.includes("mouse")) return STORE_CATEGORIES[5];
  if (nameLower.includes("tv") || nameLower.includes("electronic") || nameLower.includes("appliance")) return STORE_CATEGORIES[6];

  return {
    icon: Sparkles,
    color: "bg-slate-50 text-slate-700 border-slate-200 group-hover:bg-blue-600 group-hover:text-white",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    accentGradient: "from-blue-500 to-indigo-600",
    desc: `${categoryName} products and premium technology essentials.`,
  };
};
