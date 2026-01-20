import { Music, Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-lg">BEATKULTURE</span>
                <span className="text-xs text-muted-foreground block">(PTY) LTD</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Premium DJ services for all occasions. 26+ years of experience bringing 
              unforgettable moments to weddings, corporate events, and celebrations across South Africa.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a href="tel:+27789265866" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                078 926 5866
              </a>
              <a href="mailto:info@beatkulture.co.za" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                info@beatkulture.co.za
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Pretoria, South Africa</span>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h4 className="font-display font-semibold mb-4">Business Details</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Reg No: 2025/533623/07</p>
              <p>Tax Ref: 9270022289</p>
              <p className="mt-4 text-xs">
                Bank: First National Bank<br />
                Acc: 63189325905<br />
                Branch: 250655
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 BeatKulture (PTY) LTD. All rights reserved.</p>
          <p>www.beatkulture.co.za</p>
        </div>
      </div>
    </footer>
  );
}
