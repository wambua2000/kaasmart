import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FreeAccountPage from "./pages/FreeAccountPage";
import SecurityPage from "./pages/SecurityPage";
import SupportPage from "./pages/SupportPage";
import AboutPage from "./pages/AboutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/free-account" element={<FreeAccountPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
