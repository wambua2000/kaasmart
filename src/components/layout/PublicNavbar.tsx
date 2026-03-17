import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import kaasmartLogo from "@/assets/kaasmart-logo.png";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n";

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.product"), path: "/product" },
    { name: t("nav.howItWorks"), path: "/how-it-works" },
    { name: t("nav.freeAccount"), path: "/free-account" },
    { name: t("nav.security"), path: "/security" },
    { name: t("nav.support"), path: "/support" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={kaasmartLogo} alt="KaaSmart Logo" className="h-14 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector />
          <Button variant="outline" onClick={() => navigate("/login")}>
            {t("nav.login")}
          </Button>
          <Button onClick={() => navigate("/login")}>
            {t("nav.getStarted")}
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <LanguageSelector />
              <Button variant="outline" onClick={() => { navigate("/login"); setIsMenuOpen(false); }}>
                {t("nav.login")}
              </Button>
              <Button onClick={() => { navigate("/login"); setIsMenuOpen(false); }}>
                {t("nav.getStarted")}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
