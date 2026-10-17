import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
  RefreshCw,
  Eye,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Ban,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

import { PRODUCT_API_URL } from "../../config/api.js";
const API_URL = PRODUCT_API_URL;

const SAMPLE_LIVE_PRESETS = [
  {
    category: "Books",
    items: [
      {
        name: "Atomic Habits by James Clear",
        category: "Books",
        description: "An easy & proven way to build good habits & break bad ones. Learn how small changes deliver remarkable results.",
        price: 499,
        originalPrice: 799,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
        stock: 45,
      },
      {
        name: "The Psychology of Money",
        category: "Books",
        description: "Timeless lessons on wealth, greed, and happiness by Morgan Housel. Essential reading for financial freedom.",
        price: 299,
        originalPrice: 499,
        image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80",
        stock: 30,
      },
      {
        name: "Rich Dad Poor Dad by Robert Kiyosaki",
        category: "Books",
        description: "What the rich teach their kids about money that the poor and middle class do not!",
        price: 349,
        originalPrice: 599,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Deep Work: Rules for Focused Success",
        category: "Books",
        description: "Cal Newport provides actionable rules for focused success in a distracted digital world.",
        price: 449,
        originalPrice: 699,
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        stock: 22,
      },
      {
        name: "Clean Code: Handbook of Software Craftsmanship",
        category: "Books",
        description: "Robert C. Martin's legendary guide on writing readable, maintainable, and robust code.",
        price: 899,
        originalPrice: 1299,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80",
        stock: 18,
      },
      {
        name: "The Pragmatic Programmer",
        category: "Books",
        description: "Your journey to mastery in modern software development by David Thomas & Andrew Hunt.",
        price: 999,
        originalPrice: 1499,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
        stock: 25,
      },
      {
        name: "Sapiens: A Brief History of Humankind",
        category: "Books",
        description: "Yuval Noah Harari explores how Homo sapiens conquered Earth and shaped modern civilization.",
        price: 549,
        originalPrice: 899,
        image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80",
        stock: 40,
      },
      {
        name: "Thinking, Fast and Slow by Daniel Kahneman",
        category: "Books",
        description: "Nobel laureate Daniel Kahneman explains the two systems that drive the way we think and make choices.",
        price: 479,
        originalPrice: 799,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Zero to One: Notes on Startups",
        category: "Books",
        description: "Peter Thiel shows how to build companies that create new things and shape the future.",
        price: 379,
        originalPrice: 599,
        image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80",
        stock: 35,
      },
      {
        name: "The Alchemist by Paulo Coelho",
        category: "Books",
        description: "An inspiring fable about following your dreams, listening to your heart, and reading life's omens.",
        price: 249,
        originalPrice: 399,
        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80",
        stock: 50,
      },
    ],
  },
  {
    category: "Electronics",
    items: [
      {
        name: "Sony Bravia 55\" 4K Ultra HD Smart TV",
        category: "Electronics",
        description: "Google TV with Dolby Vision HDR, X1 4K Processor, and Dolby Atmos cinematic sound.",
        price: 52990,
        originalPrice: 74990,
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
        stock: 12,
      },
      {
        name: "LG 1.5 Ton 5 Star Dual Inverter Split AC",
        category: "Electronics",
        description: "AI Convertible 6-in-1 cooling, 100% copper condenser, HD filter with anti-virus protection.",
        price: 41990,
        originalPrice: 58990,
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
        stock: 8,
      },
      {
        name: "Samsung 345L Double Door Refrigerator",
        category: "Electronics",
        description: "Digital Inverter Compressor, Twin Cooling Plus, and Smart Connect inverter backup.",
        price: 36990,
        originalPrice: 48900,
        image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Bosch 8 kg 5 Star Front Load Washer",
        category: "Electronics",
        description: "EcoSilence Drive motor, 1400 RPM spin speed, Anti-Tangle and AllergyPlus steam wash.",
        price: 34990,
        originalPrice: 46990,
        image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
        stock: 10,
      },
      {
        name: "Philips Digital Air Fryer XL 6.2L",
        category: "Electronics",
        description: "Rapid Air Technology, 90% less fat cooking, touch screen display with 7 preset menus.",
        price: 9990,
        originalPrice: 15995,
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
        stock: 25,
      },
      {
        name: "Marshall Stanmore III Bluetooth Speaker",
        category: "Electronics",
        description: "Iconic vintage home speaker with room-filling stereo sound, dynamic loudness, and RCA input.",
        price: 31999,
        originalPrice: 39999,
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
        stock: 14,
      },
      {
        name: "Bose QuietComfort 45 ANC Headphones",
        category: "Electronics",
        description: "World-class active noise cancelling over-ear headphones with Quiet and Aware modes.",
        price: 24900,
        originalPrice: 32900,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Whirlpool 30L Convection Microwave",
        category: "Electronics",
        description: "Pre-set auto cook menus, zero oil cooking mode, stainless steel cavity, and motorized rotisserie.",
        price: 13490,
        originalPrice: 18900,
        image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80",
        stock: 19,
      },
      {
        name: "Canon EOS R6 Mark II Mirrorless Camera",
        category: "Electronics",
        description: "24.2 MP full-frame CMOS sensor, 4K 60p uncropped video, Dual Pixel CMOS AF II.",
        price: 214990,
        originalPrice: 243995,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
        stock: 5,
      },
      {
        name: "Dyson V11 Cordless Vacuum Cleaner",
        category: "Electronics",
        description: "Intelligent suction power optimization, LCD screen, 60 minutes run time, HEPA filtration.",
        price: 45900,
        originalPrice: 55900,
        image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
        stock: 7,
      },
    ],
  },
  {
    category: "Gadgets",
    items: [
      {
        name: "Apple Watch Series 9 GPS 45mm",
        category: "Gadgets",
        description: "S9 SiP chip, Double Tap gesture control, brighter Retina display, health & ECG sensors.",
        price: 37900,
        originalPrice: 44900,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        stock: 15,
      },
      {
        name: "Apple AirPods Pro (2nd Gen) USB-C",
        category: "Gadgets",
        description: "H2 chip powered active noise cancellation, adaptive audio, spatial audio, and MagSafe case.",
        price: 20900,
        originalPrice: 26900,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
        stock: 30,
      },
      {
        name: "Samsung Galaxy Tab S9 Ultra 14.6\"",
        category: "Gadgets",
        description: "Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, bundled S Pen, IP68 water resistance.",
        price: 92999,
        originalPrice: 108999,
        image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Anker PowerCore 24000mAh 140W Bank",
        category: "Gadgets",
        description: "Ultra-powerful 3-port portable charger with smart digital display and 140W fast output.",
        price: 9999,
        originalPrice: 14999,
        image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
        stock: 45,
      },
      {
        name: "Logitech MX Master 3S Wireless Mouse",
        category: "Gadgets",
        description: "8K DPI track-on-glass sensor, quiet click switches, MagSpeed electromagnetic scrolling.",
        price: 8495,
        originalPrice: 10995,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
        stock: 28,
      },
      {
        name: "Keychron K2 V2 Mechanical Keyboard",
        category: "Gadgets",
        description: "75% layout bluetooth mechanical keyboard with Gateron G Pro switches and RGB backlight.",
        price: 7499,
        originalPrice: 9999,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
        stock: 20,
      },
      {
        name: "DJI Mini 4 Pro Fly More Combo Drone",
        category: "Gadgets",
        description: "Under 249g foldable drone with 4K/60fps HDR video, omnidirectional obstacle sensing.",
        price: 94990,
        originalPrice: 112000,
        image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80",
        stock: 6,
      },
      {
        name: "Steam Deck OLED 512GB Handheld Console",
        category: "Gadgets",
        description: "90Hz HDR OLED display, faster Wi-Fi 6E, custom AMD APU for AAA PC gaming anywhere.",
        price: 54999,
        originalPrice: 64999,
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=600&auto=format&fit=crop&q=80",
        stock: 0,
      },
      {
        name: "Fitbit Charge 6 Fitness Tracker",
        category: "Gadgets",
        description: "Built-in GPS, 40+ exercise modes, ECG app, YouTube Music controls, and Google Maps.",
        price: 11999,
        originalPrice: 14999,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
        stock: 32,
      },
      {
        name: "Kindle Paperwhite 16GB 6.8\" Display",
        category: "Gadgets",
        description: "300 ppi glare-free display, adjustable warm light, IPX8 waterproof, 10 weeks battery life.",
        price: 11499,
        originalPrice: 14999,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        stock: 40,
      },
    ],
  },
  {
    category: "Smartphones",
    items: [
  {
    name: "Samsung Galaxy S25 Ultra",
    category: "Smartphones",
    description: "Premium flagship smartphone with a 6.9-inch AMOLED display, powerful processor, advanced camera system and 512GB storage.",
    price: 129999,
    discount: 10,
    stock: 12
  },
  {
    name: "iPhone 16 Pro Max",
    category: "Smartphones",
    description: "Flagship smartphone featuring a titanium design, advanced camera system, powerful performance and a stunning Super Retina XDR display.",
    price: 144999,
    discount: 8,
    stock: 15
  },
  {
    name: "OnePlus 13",
    category: "Smartphones",
    description: "High-performance smartphone with a 6.82-inch AMOLED display, flagship processor, 12GB RAM and 256GB storage.",
    price: 69999,
    discount: 12,
    stock: 18
  },
  {
    name: "Google Pixel 9 Pro",
    category: "Smartphones",
    description: "AI-powered smartphone with an advanced camera system, OLED display, powerful processor and clean Android experience.",
    price: 109999,
    discount: 15,
    stock: 9
  },
  {
    name: "Samsung Galaxy S25",
    category: "Smartphones",
    description: "Compact flagship smartphone with an AMOLED display, powerful processor, AI features and advanced camera capabilities.",
    price: 74999,
    discount: 10,
    stock: 22
  },
  {
    name: "iPhone 16",
    category: "Smartphones",
    description: "Powerful smartphone with a Super Retina XDR display, advanced dual-camera system and next-generation processor.",
    price: 79999,
    discount: 7,
    stock: 20
  },
  {
    name: "OnePlus 13R",
    category: "Smartphones",
    description: "Performance-focused smartphone with a high-refresh-rate AMOLED display, powerful processor and large battery.",
    price: 42999,
    discount: 15,
    stock: 25
  },
  {
    name: "Google Pixel 9",
    category: "Smartphones",
    description: "Premium Android smartphone with an advanced AI camera, OLED display and powerful Tensor processor.",
    price: 79999,
    discount: 12,
    stock: 14
  },
  {
    name: "Samsung Galaxy Z Fold 6",
    category: "Smartphones",
    description: "Premium foldable smartphone with a large immersive display, multitasking features and flagship performance.",
    price: 164999,
    discount: 10,
    stock: 6
  },
  {
    name: "Samsung Galaxy Z Flip 6",
    category: "Smartphones",
    description: "Compact foldable smartphone with a flexible AMOLED display, powerful processor and stylish design.",
    price: 109999,
    discount: 13,
    stock: 8
  },
  {
    name: "Xiaomi 15 Ultra",
    category: "Smartphones",
    description: "Flagship smartphone featuring a high-resolution AMOLED display, premium camera system and powerful performance.",
    price: 99999,
    discount: 11,
    stock: 10
  },
  {
    name: "Xiaomi 15",
    category: "Smartphones",
    description: "Premium compact smartphone with an AMOLED display, flagship processor and advanced photography features.",
    price: 64999,
    discount: 14,
    stock: 17
  },
  {
    name: "Nothing Phone 3",
    category: "Smartphones",
    description: "Modern smartphone featuring a unique transparent-inspired design, AMOLED display and smooth performance.",
    price: 49999,
    discount: 18,
    stock: 11
  },
  {
    name: "Motorola Edge 60 Pro",
    category: "Smartphones",
    description: "Stylish smartphone with a curved AMOLED display, powerful processor, advanced cameras and fast charging.",
    price: 44999,
    discount: 16,
    stock: 19
  },
  {
    name: "Vivo X200 Pro",
    category: "Smartphones",
    description: "Premium smartphone with a high-resolution AMOLED display, advanced camera system and large-capacity battery.",
    price: 94999,
    discount: 9,
    stock: 7
  },
  {
    name: "OPPO Find X8 Pro",
    category: "Smartphones",
    description: "Flagship smartphone with a premium AMOLED display, advanced camera technology and fast charging.",
    price: 99999,
    discount: 12,
    stock: 13
  },
  {
    name: "Realme GT 7 Pro",
    category: "Smartphones",
    description: "Performance-oriented smartphone with a high-refresh-rate AMOLED display, flagship processor and large battery.",
    price: 59999,
    discount: 15,
    stock: 21
  },
  {
    name: "iQOO 13",
    category: "Smartphones",
    description: "Gaming-focused flagship smartphone with a high-refresh-rate AMOLED display, powerful processor and fast charging.",
    price: 54999,
    discount: 10,
    stock: 16
  },
  {
    name: "Redmi Note 14 Pro+",
    category: "Smartphones",
    description: "Feature-rich smartphone with an AMOLED display, high-resolution camera, large battery and fast charging.",
    price: 32999,
    discount: 20,
    stock: 30
  },
  {
    name: "Nothing Phone 2a Plus",
    category: "Smartphones",
    description: "Affordable performance smartphone with an AMOLED display, capable camera system and long-lasting battery.",
    price: 27999,
    discount: 22,
    stock: 35
  },
    ],
  },
];

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
  stock: "",
  isActive: true,
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  const [restockProduct, setRestockProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [restockMode, setRestockMode] = useState("add");

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState("Books");
  const [discountPercentInput, setDiscountPercentInput] = useState("");

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products list");
    } finally {
      setLoading(false);
    }
  };

  // CATEGORY MANAGEMENT STATES
  const [categoriesList, setCategoriesList] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      if (res.data?.success && Array.isArray(res.data.categories)) {
        setCategoriesList(res.data.categories);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get("category");
    if (catParam) {
      setCategoryFilter(catParam);
    }
  }, [location.search]);

  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setCreatingCategory(true);
      const res = await axios.post(
        `${API_URL}/categories`,
        {
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Category "${newCategoryName.trim()}" added successfully!`);
        const addedCat = newCategoryName.trim();
        setNewCategoryName("");
        setNewCategoryDesc("");
        setFormData((prev) => ({ ...prev, category: addedCat }));
        setIsCategoryModalOpen(false);
        await fetchCategories();
      }
    } catch (err) {
      console.error("Create category error:", err);
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId, catName) => {
    if (!window.confirm(`Are you sure you want to remove category "${catName}"?`)) return;
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Category "${catName}" deleted!`);
      await fetchCategories();
    } catch (err) {
      console.error("Delete category error:", err);
      toast.error("Failed to delete category");
    }
  };

  // =====================================================
  // SEED DATABASE HANDLER
  // =====================================================

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      const res = await axios.post(
        `${API_URL}/seed`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message || "30 Sample products seeded successfully!");
      await fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed sample products.");
    } finally {
      setSeeding(false);
    }
  };

  // =====================================================
  // PRESET SELECTOR
  // =====================================================

  const handleSelectPreset = (item) => {
    const orig = Number(item.originalPrice || 0);
    const pr = Number(item.price || 0);
    const calculatedDisc = orig > pr && orig > 0 ? Math.round(((orig - pr) / orig) * 100) : "";
    setDiscountPercentInput(calculatedDisc);

    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      stock: item.stock,
      isActive: true,
    });
    toast.success(`Loaded preset: "${item.name}"`);
  };

  // =====================================================
  // FORM & PRICE DISCOUNT LOGIC
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "discountPercent") {
      setDiscountPercentInput(value);
      const disc = Number(value);
      const orig = Number(formData.originalPrice);

      if (!isNaN(disc) && disc >= 0 && disc <= 100 && !isNaN(orig) && orig > 0) {
        const calcPrice = Math.round((orig - (orig * disc) / 100) * 100) / 100;
        setFormData((prev) => ({
          ...prev,
          price: calcPrice > 0 ? calcPrice : "",
        }));
      }
      return;
    }

    if (name === "originalPrice") {
      const orig = Number(value);
      const disc = Number(discountPercentInput);

      setFormData((prev) => {
        let newPrice = prev.price;
        if (!isNaN(orig) && orig > 0 && !isNaN(disc) && disc >= 0 && disc <= 100) {
          newPrice = Math.round((orig - (orig * disc) / 100) * 100) / 100;
        } else if (
          !isNaN(orig) &&
          orig > 0 &&
          !isNaN(Number(prev.price)) &&
          Number(prev.price) > 0 &&
          orig > Number(prev.price)
        ) {
          const calculatedDisc = Math.round(((orig - Number(prev.price)) / orig) * 100);
          setDiscountPercentInput(calculatedDisc);
        }
        return {
          ...prev,
          originalPrice: value,
          price: newPrice,
        };
      });
      return;
    }

    if (name === "price") {
      const pr = Number(value);
      const orig = Number(formData.originalPrice);

      if (!isNaN(pr) && pr > 0 && !isNaN(orig) && orig > pr) {
        const calculatedDisc = Math.round(((orig - pr) / orig) * 100);
        setDiscountPercentInput(calculatedDisc);
      }

      setFormData((prev) => ({
        ...prev,
        price: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: event.target.type === "checkbox" ? event.target.checked : value,
    }));
  };

  // =====================================================
  // OPEN / CLOSE MODALS
  // =====================================================

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setDiscountPercentInput("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const orig = Number(product.originalPrice || 0);
    const pr = Number(product.price || 0);
    const calculatedDisc = orig > pr && orig > 0 ? Math.round(((orig - pr) / orig) * 100) : "";
    setDiscountPercentInput(calculatedDisc);

    setFormData({
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      price: product.price !== undefined ? product.price : "",
      originalPrice: product.originalPrice !== undefined ? product.originalPrice : "",
      image: product.image || "",
      stock: product.stock !== undefined ? product.stock : "",
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setDiscountPercentInput("");
  };

  // =====================================================
  // SUBMIT CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) return toast.error("Product name is required.");
    if (!formData.category.trim()) return toast.error("Category is required.");
    if (!formData.description.trim()) return toast.error("Description is required.");
    if (formData.price === "" || Number(formData.price) < 0) return toast.error("Price must be a valid positive number.");
    if (!formData.image.trim()) return toast.error("Image URL is required.");

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || 0,
        image: formData.image.trim(),
        stock: Number(formData.stock) || 0,
        isActive: formData.isActive,
      };

      if (editingProduct) {
        const editId = editingProduct._id || editingProduct.id;
        await axios.put(`${API_URL}/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Product updated under category "${payload.category}"!`);
      } else {
        await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Product created under category "${payload.category}"!`);
      }

      // Auto-register category in database if new
      try {
        await axios.post(
          `${API_URL}/categories`,
          { name: payload.category },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (catErr) {
        // Ignored if category exists
      }

      closeModal();
      await fetchProducts();
      await fetchCategories();
    } catch (error) {
      console.error("Save product error:", error);
      toast.error(error.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = (product) => {
    setDeleteConfirmProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    const targetProduct = deleteConfirmProduct;
    const pId = targetProduct._id || targetProduct.id;
    setDeleteConfirmProduct(null);

    try {
      await axios.delete(`${API_URL}/${pId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted successfully!");
      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error(error.response?.data?.message || "Failed to delete product.");
    }
  };

  // =====================================================
  // QUICK TOGGLE STOCK (MARK OUT OF STOCK / RESTOCK)
  // =====================================================

  const openRestockModal = (product) => {
    setRestockProduct(product);
    setRestockAmount(10);
    setRestockMode("add");
  };

  const handleConfirmRestock = async (e) => {
    if (e) e.preventDefault();
    if (!restockProduct) return;

    const currentStock = Number(restockProduct.stock || 0);
    const amount = Number(restockAmount);

    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid restock quantity.");
      return;
    }

    const newStock = restockMode === "add" ? Math.max(0, currentStock + amount) : amount;
    const restockId = restockProduct._id || restockProduct.id;

    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/${restockId}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Product "${restockProduct.name}" restocked to ${newStock} units!`);
      setRestockProduct(null);
      await fetchProducts();

      if (viewingProduct && (viewingProduct._id === restockId || viewingProduct.id === restockId)) {
        setViewingProduct((prev) => (prev ? { ...prev, stock: newStock } : null));
      }
    } catch (error) {
      console.error("Restock error:", error);
      toast.error(error.response?.data?.message || "Failed to update stock status.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleStock = async (product) => {
    const isOutOfStock = Number(product.stock) <= 0;
    const toggleId = product._id || product.id;

    if (isOutOfStock) {
      openRestockModal(product);
    } else {
      try {
        await axios.put(
          `${API_URL}/${toggleId}`,
          { stock: 0 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success(`Product "${product.name}" marked as Out of Stock (0 units).`);
        await fetchProducts();

        if (viewingProduct && (viewingProduct._id === toggleId || viewingProduct.id === toggleId)) {
          setViewingProduct((prev) => (prev ? { ...prev, stock: 0 } : null));
        }
      } catch (error) {
        console.error("Update stock error:", error);
        toast.error(error.response?.data?.message || "Failed to update stock status.");
      }
    }
  };

  // =====================================================
  // FILTERING LOGIC
  // =====================================================

  const isCategoryMatch = (productCategory, targetCategory) => {
    if (!targetCategory || targetCategory.toLowerCase() === "all") return true;
    if (!productCategory) return false;

    const pCat = productCategory.toLowerCase().trim();
    const tCat = targetCategory.toLowerCase().trim();

    if (pCat === tCat) return true;

    const pClean = pCat.replace(/[^a-z0-9]/g, "").replace(/s$/, "");
    const tClean = tCat.replace(/[^a-z0-9]/g, "").replace(/s$/, "");

    if (pClean === tClean) return true;
    if (pClean.length >= 3 && tClean.length >= 3 && (pClean.includes(tClean) || tClean.includes(pClean))) return true;

    const isPhoneP = pCat.includes("phone") || pCat.includes("mobile") || pCat.includes("smartphone");
    const isPhoneT = tCat.includes("phone") || tCat.includes("mobile") || tCat.includes("smartphone");
    if (isPhoneP && isPhoneT) return true;

    return false;
  };

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase().trim();
    const matchesSearch =
      !value ||
      product.name?.toLowerCase().includes(value) ||
      product.category?.toLowerCase().includes(value) ||
      product.description?.toLowerCase().includes(value);

    const matchesCategory = isCategoryMatch(product.category, categoryFilter);

    const stockNum = Number(product.stock || 0);
    let matchesStock = true;
    if (stockFilter === "instock") matchesStock = stockNum > 5;
    else if (stockFilter === "lowstock") matchesStock = stockNum > 0 && stockNum <= 5;
    else if (stockFilter === "outofstock") matchesStock = stockNum <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const availableCategoryNames = Array.from(
    new Set([
      "Smartphones",
      "Electronics",
      "Books",
      "Gadgets",
      "Computer Accessories",
      ...categoriesList.map((c) => (typeof c === "string" ? c : c.name)),
      ...products.map((p) => p.category).filter(Boolean),
    ])
  );

  const categories = ["all", ...availableCategoryNames];

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Inventory Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Store Products Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage product pricing, discounts, stock levels, and store visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
          >
            <Plus size={16} />
            <span>Manage Categories ({availableCategoryNames.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-xs disabled:opacity-50"
            title="Seed 30 sample products"
          >
            <Sparkles size={16} className={seeding ? "animate-spin" : ""} />
            {seeding ? "Seeding..." : "Seed 30 Sample Products"}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => { setStockFilter("all"); setCategoryFilter("all"); }}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            stockFilter === "all" && categoryFilter === "all"
              ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{products.length}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStockFilter("instock")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            stockFilter === "instock"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">In Stock (&gt;5)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {products.filter((p) => Number(p.stock) > 5).length}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStockFilter("lowstock")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            stockFilter === "lowstock"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Low Stock (1-5)</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStockFilter("outofstock")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            stockFilter === "outofstock"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Out of Stock (0)</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">
                {products.filter((p) => Number(p.stock) <= 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & VIEW TOGGLE BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* SEARCH */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, category, description..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* VIEW MODE TOGGLE & REFRESH */}
          <div className="flex flex-wrap items-center gap-3">
            {/* VIEW MODE TOGGLE BUTTONS */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={15} />
                <span>Cards Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TableIcon size={15} />
                <span>Table View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={fetchProducts}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* CATEGORY & STOCK TABS */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3 text-xs">
          {/* CATEGORY TABS */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Category:</span>
            {categories.map((cat) => {
              const isActiveTab = categoryFilter.toLowerCase() === cat.toLowerCase() || isCategoryMatch(cat, categoryFilter);
              const count = cat === "all"
                ? products.length
                : products.filter(p => isCategoryMatch(p.category, cat)).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition ${
                    isActiveTab
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{cat === "all" ? "All Categories" : cat}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActiveTab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* STOCK FILTER TABS */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Stock Status:</span>
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("instock")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === "instock" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("lowstock")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === "lowstock" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("outofstock")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === "outofstock" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT LISTING (GRID OR TABLE) */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
            <RefreshCw size={20} className="animate-spin text-blue-600" />
            Loading catalog products...
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Package size={30} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No products found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            No products match your search or filter criteria. Try clearing filters or seed sample products.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* =================================================
           CLEAN MODERN CARDS GRID VIEW
        ================================================= */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const orig = Number(product.originalPrice || 0);
            const pr = Number(product.price || 0);
            const discountPercent = orig > pr && orig > 0 ? Math.round(((orig - pr) / orig) * 100) : 0;
            const stockNum = Number(product.stock || 0);

            return (
              <div
                key={product._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  {/* PRODUCT IMAGE & BADGES */}
                  <div className="relative mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <Package size={40} className="text-slate-300" />
                    )}

                    {/* CATEGORY BADGE */}
                    <span className="absolute left-2.5 top-2.5 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 shadow-xs backdrop-blur-xs">
                      {product.category}
                    </span>

                    {/* DISCOUNT BADGE */}
                    {discountPercent > 0 && (
                      <span className="absolute right-2.5 top-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                        🔥 {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h4 className="font-bold text-slate-900 h-11 line-clamp-2 text-sm sm:text-base group-hover:text-blue-600 transition leading-snug" title={product.name}>
                    {product.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 h-8 line-clamp-2 leading-relaxed">
                    {product.description || "No product description provided."}
                  </p>

                  {/* PRICE & OFFER */}
                  <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{pr.toLocaleString("en-IN")}
                      </span>
                      {orig > pr && (
                        <span className="ml-2 text-xs font-semibold text-slate-400 line-through">
                          ₹{orig.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {orig > pr && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Save ₹{(orig - pr).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* STOCK STATUS BADGE */}
                  <div className="mt-3 flex items-center justify-between">
                    {stockNum <= 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        <AlertTriangle size={13} /> OUT OF STOCK (0)
                      </span>
                    ) : stockNum <= 5 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <AlertCircle size={13} /> LOW STOCK ({stockNum})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={13} /> In Stock ({stockNum})
                      </span>
                    )}

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${product.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="mt-4 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setViewingProduct(product)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    title="View Details"
                  >
                    <Eye size={14} /> View
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                    title="Edit Product"
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickToggleStock(product)}
                    className={`inline-flex items-center justify-center rounded-xl p-2 text-xs font-bold transition border ${
                      stockNum <= 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                    }`}
                    title={stockNum <= 0 ? "Restock Product" : "Mark Out of Stock"}
                  >
                    {stockNum <= 0 ? <RotateCcw size={15} /> : <Ban size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                    title="Delete Product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================================================
           TABLE VIEW
        ================================================= */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Price & Offer</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Stock</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const orig = Number(product.originalPrice || 0);
                  const pr = Number(product.price || 0);
                  const discountPercent = orig > pr && orig > 0 ? Math.round(((orig - pr) / orig) * 100) : 0;
                  const stockNum = Number(product.stock || 0);

                  return (
                    <tr key={product._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-100">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">₹{pr.toLocaleString("en-IN")}</span>
                            {discountPercent > 0 && (
                              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-200">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          {orig > pr && (
                            <span className="text-xs text-slate-400 line-through">₹{orig.toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {stockNum <= 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <AlertTriangle size={13} /> Out of Stock (0)
                          </span>
                        ) : stockNum <= 5 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <AlertCircle size={13} /> Low ({stockNum})
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-700">{stockNum} units</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${product.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStock(product)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition ${
                              stockNum <= 0
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                            }`}
                            title={stockNum <= 0 ? "Restock Product" : "Mark Out of Stock"}
                          >
                            {stockNum <= 0 ? <RotateCcw size={15} /> : <Ban size={15} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                            title="Edit Product"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <p className="mt-0.5 text-xs text-slate-400">Configure product details, pricing, discount, and inventory.</p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* SAMPLE PRESETS SELECTOR */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={16} />
                    <span>Quick Sample Live Product & Image Presets (10 Books, 10 Electronics, 10 Gadgets)</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">Click item to auto-fill details & HD image URL</span>
                </div>

                <div className="flex flex-wrap gap-1.5 border-b border-purple-200/60 pb-2">
                  {SAMPLE_LIVE_PRESETS.map((group) => (
                    <button
                      key={group.category}
                      type="button"
                      onClick={() => setSelectedPresetCategory(group.category)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        selectedPresetCategory === group.category
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-purple-100 border border-purple-200/80"
                      }`}
                    >
                      {group.category} ({group.items.length} items)
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 max-h-48 overflow-y-auto pr-1">
                  {SAMPLE_LIVE_PRESETS.find((g) => g.category === selectedPresetCategory)?.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(item)}
                      className={`group relative flex flex-col items-center rounded-xl border bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        formData.image === item.image ? "border-purple-600 ring-2 ring-purple-500/20" : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="h-14 w-full overflow-hidden rounded-lg bg-slate-100 mb-1">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-300" />
                      </div>
                      <p className="w-full truncate text-[11px] font-bold text-slate-800 leading-tight">{item.name}</p>
                      <p className="w-full text-[10px] font-semibold text-purple-600">₹{item.price.toLocaleString("en-IN")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* NAME & CATEGORY */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-700">Product Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Wireless Headphones"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>+ Add New Category</span>
                    </button>
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === "__add_new__") {
                        setIsCategoryModalOpen(true);
                      } else {
                        handleChange(e);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white font-medium"
                    required
                  >
                    <option value="">Select a Category</option>
                    {availableCategoryNames.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>

                  {formData.category ? (
                    <div className="mt-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                          <CheckCircle2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950 truncate">
                            Saves under: <span className="underline decoration-emerald-500 font-extrabold text-emerald-700">{formData.category}</span>
                          </p>
                          <p className="text-[11px] text-emerald-700 font-medium truncate">
                            Will automatically showcase in <strong className="text-emerald-900">{formData.category}</strong> storefront filters & home cards.
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        Active Category
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-2.5 flex items-center gap-2 text-amber-800 text-xs font-medium">
                      <AlertCircle size={15} className="shrink-0 text-amber-600" />
                      <span>Select or add a category to define where this product will save and showcase.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-700">Description *</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed product features and description..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* PRICE, ORIGINAL PRICE, DISCOUNT %, STOCK */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pricing & Discount Calculator</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Original Price (M.R.P.)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="799"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Offer Discount (%)</label>
                    <input
                      type="number"
                      name="discountPercent"
                      value={discountPercentInput}
                      onChange={handleChange}
                      placeholder="38"
                      min="0"
                      max="100"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-purple-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Discounted Selling Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="499"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Stock Units *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="25"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* IMAGE URL */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-700">Image URL *</label>
                <div className="flex gap-3 items-center">
                  <input
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {formData.image && (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                      <img src={formData.image} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIVE STATUS */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">Active Product</p>
                  <p className="text-xs text-slate-400">Active products are instantly displayed to clients in the store.</p>
                </div>
              </label>

              {/* MODAL BUTTONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT DETAILS MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={22} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Product Specification</span>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{viewingProduct.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {viewingProduct.image ? (
                    <img src={viewingProduct.image} alt={viewingProduct.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Package size={48} className="text-slate-300" />
                  )}
                  {viewingProduct.category && (
                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 shadow-xs border border-slate-100">
                      {viewingProduct.category}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Name</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{viewingProduct.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Selling Price</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        ₹{Number(viewingProduct.price || 0).toLocaleString("en-IN")}
                      </p>
                      {Number(viewingProduct.originalPrice) > Number(viewingProduct.price) && (
                        <p className="text-xs text-slate-400 line-through">
                          ₹{Number(viewingProduct.originalPrice).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Stock Level</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {viewingProduct.stock} units
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Stock Status</p>
                    {Number(viewingProduct.stock) <= 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200">
                        <AlertTriangle size={15} /> Out of Stock (0 units remaining)
                      </span>
                    ) : Number(viewingProduct.stock) <= 5 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200">
                        <AlertCircle size={15} /> Low Stock Warning ({viewingProduct.stock} units remaining)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200">
                        <CheckCircle2 size={15} /> In Stock ({viewingProduct.stock} units available)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</p>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {viewingProduct.description || "No product description provided."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">Product ID: {viewingProduct._id}</span>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleQuickToggleStock(viewingProduct)}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                      Number(viewingProduct.stock) <= 0
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    {Number(viewingProduct.stock) <= 0 ? (
                      <>
                        <RotateCcw size={15} /> Restock Product
                      </>
                    ) : (
                      <>
                        <Ban size={15} /> Mark Out of Stock
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prod = viewingProduct;
                      setViewingProduct(null);
                      openEditModal(prod);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    <Pencil size={15} /> Edit Product
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prod = viewingProduct;
                      setViewingProduct(null);
                      handleDelete(prod);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK PRODUCT MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Restock Product</h3>
                  <p className="text-xs text-slate-500">Update inventory for selected product</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="mt-5 space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">Selected Product</span>
                  <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase text-blue-600 border border-blue-100">
                    Category: {restockProduct.category}
                  </span>
                </div>
                <h4 className="mt-1 text-base font-bold text-slate-900">{restockProduct.name}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Current Stock: <span className="font-bold text-slate-700">{restockProduct.stock || 0} units</span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Restock Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestockMode("add")}
                    className={`rounded-xl border p-3 text-left transition ${
                      restockMode === "add"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold">Add to Stock</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Add units to current stock</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestockMode("set")}
                    className={`rounded-xl border p-3 text-left transition ${
                      restockMode === "set"
                        ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold">Set Total Stock</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Override stock with exact number</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockAmount(num)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                        Number(restockAmount) === num
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      +{num} units
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                  {restockMode === "add" ? "Units to Add *" : "New Total Stock *"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  <RotateCcw size={15} />
                  {saving ? "Saving..." : "Confirm Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">Delete Product?</h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{deleteConfirmProduct.name}</strong>? This action will remove it from the store inventory.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Store Categories</h3>
                  <p className="text-xs text-slate-500">Create new categories or manage existing ones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* CREATE NEW CATEGORY FORM */}
            <form onSubmit={handleCreateCategory} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Add Another Category</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Home Appliances, Wearables, Gaming)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                  required
                />
                <input
                  type="text"
                  placeholder="Brief Description (optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={creatingCategory || !newCategoryName.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creatingCategory ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                {creatingCategory ? "Creating..." : "Save & Add Category"}
              </button>
            </form>

            {/* EXISTING CATEGORIES LIST */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Available Store Categories ({availableCategoryNames.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {availableCategoryNames.map((catName) => {
                  const customObj = Array.isArray(categoriesList) ? categoriesList.find((c) => (c.name || c) === catName) : null;
                  const count = products.filter((p) => p.category?.toLowerCase() === catName.toLowerCase()).length;

                  return (
                    <div key={catName} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{catName}</span>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {count} {count === 1 ? "product" : "products"}
                        </span>
                      </div>
                      {customObj?.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(customObj._id, catName)}
                          className="text-rose-500 hover:text-rose-700 transition p-1 rounded hover:bg-rose-50"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;