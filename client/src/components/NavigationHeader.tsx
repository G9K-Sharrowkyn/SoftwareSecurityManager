import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rocket, Home, Layers, Trophy, Gift, User, LogOut, Bell } from "lucide-react";
import { useLocation } from "wouter";

export default function NavigationHeader() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="navigation-header sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <Rocket className="text-primary text-2xl" />
              <span className="text-2xl font-bold text-glow">
                Proteus Nebula
              </span>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              Battle Card Game
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="hover:text-primary"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/collection")}
              className="hover:text-primary"
            >
              <Layers className="mr-2 h-4 w-4" />
              Collection
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/deck-builder")}
              className="hover:text-primary"
            >
              <Gift className="mr-2 h-4 w-4" />
              Deck Builder
            </Button>
            <Button 
              variant="ghost" 
              className="hover:text-primary"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Rankings
            </Button>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 bg-destructive text-white text-xs min-w-[1.2rem] h-5 px-1">
                3
              </Badge>
            </Button>

            {/* Credits */}
            <div className="hidden md:flex items-center space-x-2 bg-card/50 rounded-lg px-3 py-2 border border-border">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span className="font-semibold text-primary">
                {user?.credits || 0}
              </span>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Level {user?.level || 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user?.experience || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/collection")}>
                  <Layers className="mr-2 h-4 w-4" />
                  Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/deck-builder")}>
                  <Gift className="mr-2 h-4 w-4" />
                  Deck Builder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
