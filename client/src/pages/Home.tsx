import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import BoosterPackModal from "@/components/BoosterPackModal";

interface UserStats {
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentLevel: number;
  experience: number;
  rank: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBoosterModal, setShowBoosterModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
    retry: false,
  });

  const createQuickGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games", {
        gameType: "ai",
        player2Id: null,
      });
      return response.json();
    },
    onSuccess: (game) => {
      window.location.href = `/game/${game.id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const buyBoosterPackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs", {
        packType: "standard",
        cost: 100,
        cardCount: 5,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Booster pack purchased!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to purchase booster pack",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const startQuickMatch = () => {
    createQuickGameMutation.mutate();
  };

  const buyBoosterPack = () => {
    if (!user || user.currency < 100) {
      toast({
        title: "Insufficient Currency",
        description: "You need at least 100 credits to buy a booster pack",
        variant: "destructive",
      });
      return;
    }
    buyBoosterPackMutation.mutate();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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
              <Link href="/" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-home mr-2"></i>Dashboard
              </Link>
              <Link href="/collection" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-layer-group mr-2"></i>Collection
              </Link>
              <Link href="/rankings" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                <i className="fas fa-trophy mr-2"></i>Rankings
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-cosmic-700 px-3 py-2 rounded-lg">
                  <i className="fas fa-coins text-cosmic-gold"></i>
                  <span className="text-sm font-semibold">{user?.currency || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img 
                    src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                    alt="Player Avatar" 
                    className="w-10 h-10 rounded-full border-2 border-cosmic-gold object-cover" 
                  />
                  <span className="text-sm font-medium">{user?.firstName || "Commander"}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-cosmic-900"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 min-h-screen pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-glow">
              Command Center
            </h1>
            <p className="text-xl text-cosmic-silver mb-8 max-w-2xl mx-auto">
              Welcome back, Commander. Your fleet awaits your orders.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={startQuickMatch}
                disabled={createQuickGameMutation.isPending}
                className="bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cosmic-gold/50"
              >
                {createQuickGameMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Launching...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt mr-2"></i>Quick Battle
                  </>
                )}
              </Button>
              <Link href="/deck-builder">
                <Button className="bg-gradient-to-r from-cosmic-blue to-cosmic-blue-light text-cosmic-silver font-bold px-8 py-4 rounded-xl border border-cosmic-gold transition-all duration-300 transform hover:scale-105">
                  <i className="fas fa-layer-group mr-2"></i>Deck Builder
                </Button>
              </Link>
              <Button 
                onClick={() => setShowBoosterModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <i className="fas fa-gift mr-2"></i>Open Packs ({boosterPacks?.length || 0})
              </Button>
            </div>
          </div>

          {/* Game Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                  <i className="fas fa-sword text-white text-2xl"></i>
                </div>
                <CardTitle className="text-cosmic-gold">Quick Match</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cosmic-silver mb-4 text-center">
                  Jump into battle against AI opponents with varying difficulty levels
                </p>
                <div className="flex justify-center space-x-2">
                  <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">Easy</span>
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full">Medium</span>
                  <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">Hard</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                  <i className="fas fa-trophy text-cosmic-900 text-2xl"></i>
                </div>
                <CardTitle className="text-cosmic-gold">Ranked Battle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cosmic-silver mb-4 text-center">
                  Compete against other commanders for galactic supremacy
                </p>
                <div className="flex justify-center">
                  <span className="px-4 py-2 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 text-sm font-semibold rounded-full">
                    Current Rank: {stats?.rank || "Recruit"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Link href="/collection">
              <Card className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                    <i className="fas fa-layer-group text-white text-2xl"></i>
                  </div>
                  <CardTitle className="text-cosmic-gold">Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-cosmic-silver mb-4 text-center">
                    Browse your card collection and manage your fleet
                  </p>
                  <div className="text-cosmic-gold font-semibold text-center">
                    Cards Collected
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Player Stats Section */}
          <Card className="bg-gradient-to-r from-cosmic-800/50 to-cosmic-700/50 border border-cosmic-600 mb-12">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-cosmic-gold text-center">Commander Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center">
                  <i className="fas fa-spinner fa-spin text-cosmic-gold text-2xl"></i>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cosmic-gold">{stats?.totalWins || 0}</div>
                    <div className="text-cosmic-silver">Total Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cosmic-gold">{stats?.winRate || 0}%</div>
                    <div className="text-cosmic-silver">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cosmic-gold">{stats?.currentLevel || 1}</div>
                    <div className="text-cosmic-silver">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cosmic-gold">{stats?.experience || 0}</div>
                    <div className="text-cosmic-silver">Experience</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              onClick={buyBoosterPack}
              disabled={!user || user.currency < 100 || buyBoosterPackMutation.isPending}
              className="bg-cosmic-gold hover:bg-cosmic-gold-dark text-cosmic-900 font-semibold px-6 py-3 rounded-lg"
            >
              {buyBoosterPackMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Purchasing...
                </>
              ) : (
                <>
                  <i className="fas fa-shopping-cart mr-2"></i>Buy Booster Pack (100 Credits)
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <BoosterPackModal 
        isOpen={showBoosterModal} 
        onClose={() => setShowBoosterModal(false)} 
      />
    </div>
  );
}
