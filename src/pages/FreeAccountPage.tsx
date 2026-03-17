import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicLayout from "@/components/layout/PublicLayout";
import { Check, Building2, Users, Wallet, LayoutDashboard, UserCheck, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";

const FreeAccountPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    property_name: "",
    phone_number: "",
  });

  const features = [
    { icon: Building2, text: t("free.features.1") },
    { icon: Users, text: t("free.features.2") },
    { icon: Wallet, text: t("free.features.3") },
    { icon: LayoutDashboard, text: t("free.features.4") },
    { icon: UserCheck, text: t("free.features.5") },
    { icon: BookOpen, text: t("free.features.6") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.property_name || !form.phone_number) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("free_account_signups" as any).insert([form] as any);
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }

    setIsSuccess(true);
    toast({ title: "Success!", description: t("free.form.success") });
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              {t("free.hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("free.hero.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-8">
            {t("free.features.title")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <Card key={i} className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm">{feature.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-lg mx-auto">
            <Card className="border-primary/20">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary text-center mb-6">
                  {t("free.form.title")}
                </h2>

                {isSuccess ? (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("free.form.success")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">{t("free.form.firstName")}</Label>
                        <Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">{t("free.form.lastName")}</Label>
                        <Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("free.form.email")}</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property_name">{t("free.form.propertyName")}</Label>
                      <Input id="property_name" value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">{t("free.form.phone")}</Label>
                      <Input id="phone_number" type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("free.form.submitting")}</>
                      ) : (
                        t("free.form.submit")
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FreeAccountPage;
