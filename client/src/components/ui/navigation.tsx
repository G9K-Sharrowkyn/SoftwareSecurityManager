import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-home" },
    { href: "/collection", label: "Collection", icon: "fas fa-layer-group" },
    { href: "/deck-builder", label: "Deck Builder", icon: "fas fa-hammer" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
              <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button 
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    location === item.href 
                      ? "text-cosmic-gold bg-cosmic-gold/10" 
                      : "text-cosmic-silver hover:text-cosmic-gold"
                  }`}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              </Link>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* Currency */}
            <div className="flex items-center space-x-2 bg-cosmic-blue/50 rounded-lg px-3 py-2 border border-cosmic-gold/30">
              <i className="fas fa-coins text-cosmic-gold"></i>
              <span className="font-semibold text-cosmic-gold">{user?.currency || 0}</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-cosmic-blue/50 rounded-lg px-4 py-2 border border-cosmic-gold/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmic-gold to-amber-500 overflow-hidden">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-cosmic-gold/20 flex items-center justify-center">
                    <i className="fas fa-user text-cosmic-gold text-sm"></i>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-cosmic-silver">
                  {user?.firstName || "Commander"}
                </div>
                <div className="text-xs text-cosmic-silver/70">
                  Level {user?.level || 1}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-cosmic-600 text-cosmic-silver hover:bg-cosmic-600"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
