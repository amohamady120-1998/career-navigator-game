import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import atharLogoLight from "@/assets/athar-logo-light.png";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 text-center">
      <img src={atharLogoLight} alt="أثر البداية" className="h-16 mb-8 object-contain" />
      <h1 className="text-8xl font-bold text-accent mb-4">404</h1>
      <p className="text-xl text-primary-foreground/70 mb-8">
        عذراً، الصفحة التي تبحث عنها غير موجودة
      </p>
      <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12">
        <Link to="/">العودة للرئيسية</Link>
      </Button>
    </div>
  );
};

export default NotFound;
