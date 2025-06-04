import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarBackground from "@/components/StarBackground";
import BoosterPack from "@/components/BoosterPack";
import DeckBuilder from "@/components/DeckBuilder";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: collection } = useQuery({
    queryKey: ["/api/collection"],
    enabled: isAuthenticated,
  });

  const { data: decks } = useQuery({
    queryKey: ["/api/decks"],
    enabled: isAuthenticated,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
    enabled: isAuthenticated,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: { isAI: boolean; aiDifficulty?: string }) => {
      const response = await apiRequest("POST", "/api/games", gameData);
      return response.json();
    },
    onSuccess: (game) => {
      setLocation(`/game/${game.id}`);
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

  const handleStartGame = (aiDifficulty: string) => {
    createGameMutation.mutate({ isAI: true, aiDifficulty });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      
      {/* Navigation Header */}
      <nav className="relative z-50 bg-gradient-to-r from-background/80 via-card/80 to-background/80 backdrop-blur-lg border-b border-primary/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-primary animate-glow">
                <i className="fas fa-rocket mr-2"></i>
                Proteus Nebula
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-card/50 rounded-lg px-4 py-2 border border-primary/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1614728263952-84ea256f9679?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold">{user?.username || user?.firstName || "Commander"}</div>
                  <div className="text-xs text-muted-foreground">Level {user?.level || 1}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-card/50 rounded-lg px-3 py-2 border border-accent/30">
                <i className="fas fa-coins text-accent"></i>
                <span className="font-semibold text-accent">{user?.credits || 0}</span>
              </div>

              <Button variant="outline" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6 animate-glow">
            Welcome, Commander
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your fleet awaits your orders. Choose your path to galactic domination.
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center group-hover:animate-pulse">
                  <i className="fas fa-robot text-white text-xl"></i>
                </div>
                <span>Quick Battle</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Test your skills against AI opponents of varying difficulty
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleStartGame("easy")} 
                  className="w-full"
                  variant="outline"
                  disabled={createGameMutation.isPending}
                >
                  <Badge className="bg-green-600 mr-2">Easy</Badge>
                  Start Easy Battle
                </Button>
                <Button 
                  onClick={() => handleStartGame("medium")} 
                  className="w-full"
                  variant="outline"
                  disabled={createGameMutation.isPending}
                >
                  <Badge className="bg-yellow-600 mr-2">Medium</Badge>
                  Start Medium Battle
                </Button>
                <Button 
                  onClick={() => handleStartGame("hard")} 
                  className="w-full"
                  variant="outline"
                  disabled={createGameMutation.isPending}
                >
                  <Badge className="bg-red-600 mr-2">Hard</Badge>
                  Start Hard Battle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <i className="fas fa-layer-group text-primary-foreground text-xl"></i>
                </div>
                <span>Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage your cards and build powerful decks
              </p>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{collection?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Cards Collected</div>
                </div>
                <DeckBuilder />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-gift text-white text-xl"></i>
                </div>
                <span>Booster Packs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Open packs to discover new cards and expand your collection
              </p>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{boosterPacks?.reduce((sum, pack) => sum + pack.quantity, 0) || 0}</div>
                  <div className="text-sm text-muted-foreground">Packs Available</div>
                </div>
                <BoosterPack />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Player Stats */}
        <Card className="bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm border-primary/30 mb-8">
          <CardHeader>
            <CardTitle className="text-center text-primary text-2xl">
              <i className="fas fa-chart-line mr-2"></i>
              Commander Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{user?.wins || 0}</div>
                <div className="text-muted-foreground">Victories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {user?.wins && user?.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
                </div>
                <div className="text-muted-foreground">Win Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.level || 1}</div>
                <div className="text-muted-foreground">Level</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.experience || 0}</div>
                <div className="text-muted-foreground">Experience</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">
              <i className="fas fa-history mr-2"></i>
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-muted-foreground">Active Decks</span>
                <span className="text-primary font-semibold">{decks?.filter(deck => deck.isActive).length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-muted-foreground">Total Decks</span>
                <span className="text-primary font-semibold">{decks?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                <span className="text-muted-foreground">Booster Packs</span>
                <span className="text-primary font-semibold">{boosterPacks?.reduce((sum, pack) => sum + pack.quantity, 0) || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
