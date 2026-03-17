import { Link } from "react-router-dom";
import kaasmartLogo from "@/assets/kaasmart-logo.png";
import { useLanguage } from "@/lib/i18n";

const PublicFooter = () => {
  const { t } = useLanguage();

  const footerLinks = [
    { name: t("nav.product"), path: "/product" },
    { name: t("nav.howItWorks"), path: "/how-it-works" },
    { name: t("nav.freeAccount"), path: "/free-account" },
    { name: t("nav.security"), path: "/security" },
    { name: t("nav.support"), path: "/support" },
    { name: t("nav.about"), path: "/about" },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <img src={kaasmartLogo} alt="KaaSmart Logo" className="h-12 w-auto" />
            <p className="text-lg font-semibold text-primary">{t("footer.tagline")}</p>
            <p className="text-sm text-muted-foreground">{t("footer.desc")}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t("footer.quickLinks")}</h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link key={link.path} to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t("footer.contactUs")}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><a href="mailto:info@kaasmart.com" className="hover:text-primary transition-colors">info@kaasmart.com</a></p>
              <p><a href="https://www.kaasmart.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">www.kaasmart.com</a></p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
