import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ScrollToTop component automatically scrolls window to top on any route or query change
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
