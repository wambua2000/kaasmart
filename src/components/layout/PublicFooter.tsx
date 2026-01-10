import { Link } from "react-router-dom";
import kaasmartLogo from "@/assets/kaasmart-logo.png";

const footerLinks = [
  { name: "Product", path: "/product" },
  { name: "How It Works", path: "/how-it-works" },
  { name: "Pricing", path: "/pricing" },
  { name: "Security", path: "/security" },
  { name: "Support", path: "/support" },
  { name: "About", path: "/about" },
];

const PublicFooter = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img src={kaasmartLogo} alt="KaaSmart Logo" className="h-12 w-auto" />
            <p className="text-lg font-semibold text-primary">
              Property Management Made Simple
            </p>
            <p className="text-sm text-muted-foreground">
              A centralized, secure, real-time property management platform for Africa and beyond.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <a href="mailto:info@kaasmart.com" className="hover:text-primary transition-colors">
                  info@kaasmart.com
                </a>
              </p>
              <p>
                <a href="https://www.kaasmart.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  www.kaasmart.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2026 KaaSmart Technologies. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
