import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { Check, Building2, Zap, Shield, Headphones } from "lucide-react";

const PricingPage = () => {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for individual landlords with a few properties",
      price: "Contact Us",
      period: "",
      features: [
        "Up to 3 properties",
        "Basic dashboards for all roles",
        "Tenant management",
        "Rent tracking",
        "Basic maintenance requests",
        "Email support"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Professional",
      description: "Ideal for growing property management needs",
      price: "Contact Us",
      period: "",
      features: [
        "Up to 20 properties",
        "Advanced analytics & reports",
        "Financial agent dashboards",
        "Priority maintenance workflows",
        "In-system messaging",
        "Priority support",
        "Custom branding options"
      ],
      cta: "Get Started",
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "For large-scale property management companies",
      price: "Custom",
      period: "",
      features: [
        "Unlimited properties",
        "Custom feature development",
        "Dedicated account manager",
        "API access & integrations",
        "Advanced security features",
        "SLA guarantees",
        "On-site training available",
        "White-label options"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <PublicLayout>
      {/* SECTION 1: PRICING PHILOSOPHY */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Affordable for small landlords, scalable for enterprises.
            </p>
            <p className="text-muted-foreground">
              Choose a plan that fits your portfolio size and grow without limits.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: PLANS */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-xl transition-shadow ${
                  plan.highlighted ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-2xl text-primary">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/support">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PRICING MODEL */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                How Our Pricing Works
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Subscription-Based</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Pay monthly or annually for predictable costs. Annual plans include a discount 
                    to reward long-term commitment.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Per-Property Scaling</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Pricing scales based on the number of properties or units you manage. 
                    Only pay for what you use.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No Hidden Fees</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    All core features are included in your plan. No surprise charges for 
                    basic functionality or support.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Headphones className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Optional Add-Ons</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Additional features like advanced integrations, custom reports, or 
                    dedicated support can be added as needed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                Contact our team to discuss your needs and find the perfect plan for your property portfolio.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/login">View Pricing</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  asChild
                >
                  <Link to="/support">Talk to Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PricingPage;