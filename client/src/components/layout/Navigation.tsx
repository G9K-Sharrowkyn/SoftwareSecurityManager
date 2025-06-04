import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-home" },
    { href: "/collection", label: "Collection", icon: "fas fa-layer-group" },
    { href: "/rankings", label: "Rankings", icon: "fas fa-trophy" },
  ];

  return (
    <nav className="bg-gradient-to-r from-cosmic-900 via-cosmic-800 to-cosmic-900 border-b border-cosmic-gold/30 sticky top-0 z-50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
              <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
            </Link>
            <span className="hidden md:block text-sm text-cosmic-silver/70">
              Battle Card Game
            </span>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 transition-colors ${
                    location === item.href
                      ? "text-cosmic-gold"
                      : "text-cosmic-silver hover:text-cosmic-gold"
                  }`}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Credits Display */}
                <div className="flex items-center space-x-2 bg-cosmic-blue/50 rounded-lg px-3 py-2 border border-cosmic-gold/30">
                  <i className="fas fa-coins text-cosmic-gold"></i>
                  <span className="font-semibold text-cosmic-gold">{user.credits}</span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3 bg-cosmic-blue/50 rounded-lg px-4 py-2 border border-cosmic-gold/30 hover:border-cosmic-gold">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.username} />
                        <AvatarFallback className="bg-cosmic-gold text-cosmic-900">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-semibold text-cosmic-silver">{user.username}</div>
                        <div className="text-xs text-cosmic-silver/70">Level {user.level}</div>
                      </div>
                      <i className="fas fa-chevron-down text-cosmic-silver/70"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-cosmic-800 border-cosmic-gold/30">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center space-x-2">
                        <i className="fas fa-user"></i>
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center space-x-2">
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="flex items-center space-x-2">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Sign Out</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                asChild
                className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-900 font-semibold"
              >
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
