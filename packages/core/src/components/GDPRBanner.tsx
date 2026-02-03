import React, { useState, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { X } from "lucide-react";
import { Link } from "wouter";

export default function GDPRBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("complianceos-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("complianceos-cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">We value your privacy</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
            By clicking "Accept All", you consent to our use of cookies. 
            Read our <Link href="/privacy-policy" className="underline text-primary hover:text-primary/80">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => setIsVisible(false)} className="w-full md:w-auto">
            Decline
          </Button>
          <Button size="sm" onClick={acceptCookies} className="w-full md:w-auto">
            Accept All
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="absolute top-2 right-2 md:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
