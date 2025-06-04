import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StarBackground from "@/components/ui/star-background";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: activeGame } = useQuery({
    queryKey: ["/api/games/active"],
    retry: false,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user) return null;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const startQuickMatch = async () => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameType: 'ai' })
      });

      if (!response.ok) throw new Error('Failed to start game');

      const game = await response.json();
      window.location.href = `/game?id=${game.id}`;
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      
      {/* Navigation Header */}
      <nav className="relative z-50 bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="/collection" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </a>
              <a href="/deck-builder" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-hammer mr-2"></i>Deck Builder
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-cosmic-700 px-3 py-2 rounded-lg">
                <i className="fas fa-coins text-cosmic-gold"></i>
                <span className="text-sm font-semibold">{userStats?.credits || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src={user.profileImageUrl || "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                  alt="Player Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-cosmic-gold object-cover" 
                />
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{user.username || user.firstName || "Commander"}</div>
                  <div className="text-xs text-cosmic-silver/70">Level {userStats?.level || 1}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-glow">
              Welcome Back, Commander
            </h1>
            <p className="text-xl text-cosmic-silver mb-8 max-w-2xl mx-auto">
              Your fleet awaits your orders. Choose your battle and lead your forces to victory across the galaxy.
            </p>
            
            {activeGame ? (
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 mr-4"
                onClick={() => window.location.href = `/game?id=${activeGame.id}`}
              >
                <i className="fas fa-play mr-2"></i>Continue Game
              </Button>
            ) : null}
            
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Button 
                size="lg"
                onClick={startQuickMatch}
                className="bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 font-bold px-8 py-4 hover:scale-105 transition-transform duration-200"
              >
                <i className="fas fa-bolt mr-2"></i>Quick Battle
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/deck-builder"}
                className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-900 font-bold px-8 py-4"
              >
                <i className="fas fa-layer-group mr-2"></i>Deck Builder
              </Button>
            </div>
          </div>

          {/* Game Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                  <i className="fas fa-sword text-white text-2xl"></i>
                </div>
                <CardTitle className="text-cosmic-gold">AI Battle</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-cosmic-silver mb-4">
                  Test your skills against AI opponents with varying difficulty levels
                </CardDescription>
                <div className="flex justify-center space-x-2">
                  <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">Easy</span>
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full">Medium</span>
                  <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">Hard</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                  <i className="fas fa-trophy text-cosmic-900 text-2xl"></i>
                </div>
                <CardTitle className="text-cosmic-gold">Ranked Battle</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-cosmic-silver mb-4">
                  Compete against other commanders for galactic supremacy
                </CardDescription>
                <div className="flex justify-center">
                  <span className="px-4 py-2 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 text-sm font-semibold rounded-full">
                    Current Rank: {userStats?.currentRank || "Recruit"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                  <i className="fas fa-layer-group text-white text-2xl"></i>
                </div>
                <CardTitle className="text-cosmic-gold">Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-cosmic-silver mb-4">
                  Browse your card collection and manage your fleet
                </CardDescription>
                <div className="text-cosmic-gold font-semibold text-center">
                  Cards Collected
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Stats Section */}
          <Card className="bg-gradient-to-r from-cosmic-800/50 to-cosmic-700/50 border-cosmic-600 mb-12">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-cosmic-gold text-center">Commander Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">{userStats?.gamesWon || 0}</div>
                  <div className="text-cosmic-silver">Total Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">
                    {userStats?.gamesPlayed ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100) : 0}%
                  </div>
                  <div className="text-cosmic-silver">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">{userStats?.level || 1}</div>
                  <div className="text-cosmic-silver">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">{userStats?.experience || 0}</div>
                  <div className="text-cosmic-silver">Experience</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <FloatingActionMenu />
    </div>
  );
}
