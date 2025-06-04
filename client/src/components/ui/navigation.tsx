import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Rocket, User, Coins, Home, Layers, Trophy, Settings } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/collection", label: "Collection", icon: Layers },
    { path: "/deck-builder", label: "Deck Builder", icon: Settings },
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-primary/30 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary text-glow">Proteus Nebula</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "default" : "ghost"}
                onClick={() => setLocation(item.path)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* Credits */}
            <div className="flex items-center space-x-2 bg-primary/20 rounded-lg px-3 py-2 border border-primary/30">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">{user?.credits || 0}</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-card/50 rounded-lg px-4 py-2 border border-primary/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold">
                  {user?.firstName || `Commander ${user?.id?.slice(-4)}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  Level {user?.level || 1}
                </div>
              </div>
            </div>

            {/* Logout */}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex justify-center space-x-4">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location === item.path ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation(item.path)}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
