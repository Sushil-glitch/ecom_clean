import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shop from "./Client/Shop.jsx";
import Navbar from "../components/Navbar.jsx";
import BackToTop from "../components/BackToTop.jsx";
import Footer from "../components/Footer.jsx";

const PublicShop = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getUser();
  const role = user?.role || localStorage.getItem("role") || "";

  useEffect(() => {
    // If logged in client accesses /shop, redirect to /client/shop for full portal experience preserving query params
    if (isLoggedIn && role?.toLowerCase() === "client") {
      navigate(`/client/shop${window.location.search}`, { replace: true });
    }
  }, [isLoggedIn, role, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* NAVBAR */}
      <Navbar />

      {/* SHOP CONTENT AREA */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Shop />
      </main>

      {/* FOOTER */}
      <Footer />

      <BackToTop />
    </div>
  );
};

export default PublicShop;
