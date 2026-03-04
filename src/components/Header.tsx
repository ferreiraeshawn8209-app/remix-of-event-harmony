import { Menu, X, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import logoImg from "@/assets/logo.png";

type NavItem = {
  id: "home" | "quote" | "admin";
  label: string;
  to: string;
};

function getActiveNavId(pathname: string, hash: string): NavItem["id"] {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/" && hash === "#quote-calculator") return "quote";
  return "home";
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeNavId = getActiveNavId(location.pathname, location.hash);

  const navItems: NavItem[] = [
    { id: "home", label: "Home", to: "/" },
    { id: "quote", label: "Get Quote", to: "/#quote-calculator" },
    ...(isAdmin ? ([{ id: "admin", label: "Admin", to: "/admin" }] as NavItem[]) : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img src={logoImg} alt="BeatKulture" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight">BEATKULTURE ENTERTAINMENT</span>
              <span className="text-xs text-muted-foreground">One Beat. One Kulture. One Love.</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeNavId === item.id ? "default" : "ghost"}
                className="px-4"
                asChild
              >
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                {isAdmin && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="w-4 h-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="hero" size="sm" className="ml-4" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeNavId === item.id ? "default" : "ghost"}
                  className="justify-start"
                  asChild
                >
                  <Link to={item.to} onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                </Button>
              ))}
              
              {/* Mobile Auth Section */}
              {user ? (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="hero" className="justify-start" asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
