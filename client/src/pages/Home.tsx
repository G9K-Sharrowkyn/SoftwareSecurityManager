import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/Navigation";
import { Sword, Users, Gift, Trophy, Play, Layers, Star } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Initialize game data
  const initDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/init-data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Success",
        description: "Game data initialized successfully!",
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
      console.error("Error initializing data:", error);
    },
  });

  // Fetch user's games
  const { data: userGames } = useQuery({
    queryKey: [`/api/users/${user?.id}/games`],
    enabled: !!user?.id,
  });

  // Fetch user's decks
  const { data: userDecks } = useQuery({
    queryKey: [`/api/users/${user?.id}/decks`],
    enabled: !!user?.id,
  });

  // Fetch user's booster packs
  const { data: boosterPacks } = useQuery({
    queryKey: [`/api/users/${user?.id}/boosters`],
    enabled: !!user?.id,
  });

  // Create AI game
  const createAiGameMutation = useMutation({
    mutationFn: async (difficulty: string) => {
      const response = await apiRequest("POST", "/api/games", {
        isAiGame: true,
        aiDifficulty: difficulty,
        status: "active",
        currentPhase: "Command",
        gameState: {
          player1Health: 100,
          player2Health: 100,
          commandPoints: { player1: 0, player2: 0 },
          turnNumber: 1,
        },
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
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Star className="h-12 w-12 text-mystic-gold animate-spin mx-auto mb-4" />
          <p className="text-star-silver">Loading your command center...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative z-10">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-amber mb-6 animate-glow">
            Welcome Back, Commander
          </h1>
          <p className="text-xl text-star-silver mb-8">
            Ready to expand your galactic empire? Choose your next mission.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-500/30 hover:border-red-400 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <Sword className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-red-200 mb-2">Quick Battle</h3>
              <p className="text-red-300/70 mb-4">Jump into combat against AI opponents</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => createAiGameMutation.mutate("Easy")}
                  disabled={createAiGameMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Easy
                </Button>
                <Button 
                  onClick={() => createAiGameMutation.mutate("Medium")}
                  disabled={createAiGameMutation.isPending}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  size="sm"
                >
                  Medium
                </Button>
                <Button 
                  onClick={() => createAiGameMutation.mutate("Hard")}
                  disabled={createAiGameMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Hard
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cosmic-blue/30 to-midnight/30 border border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-mystic-gold to-amber rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <Users className="h-8 w-8 text-space-black" />
              </div>
              <h3 className="text-xl font-bold text-mystic-gold mb-2">Multiplayer</h3>
              <p className="text-star-silver/70 mb-4">Challenge other commanders</p>
              <Button className="w-full bg-mystic-gold hover:bg-amber text-space-black font-semibold">
                Find Match
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 hover:border-purple-400 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-200 mb-2">Booster Packs</h3>
              <p className="text-purple-300/70 mb-4">
                Available: {boosterPacks?.filter((pack: any) => !pack.isOpened).length || 0}
              </p>
              <Link href="/collection">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Open Packs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-cosmic-blue/50 border-mystic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mystic-gold">{user.wins || 0}</div>
              <div className="text-star-silver/70">Total Wins</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/50 border-mystic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mystic-gold">
                {user.wins && user.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
              </div>
              <div className="text-star-silver/70">Win Rate</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/50 border-mystic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mystic-gold">{user.level || 1}</div>
              <div className="text-star-silver/70">Level</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/50 border-mystic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-mystic-gold">{user.experience || 0}</div>
              <div className="text-star-silver/70">Experience</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-cosmic-blue/40 to-midnight/40 border border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-mystic-gold">
                <Layers className="mr-2 h-5 w-5" />
                Deck Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-silver/70 mb-4">
                Build and customize your fleet. Active decks: {userDecks?.filter((deck: any) => deck.isActive).length || 0}
              </p>
              <Link href="/deck-builder">
                <Button className="w-full bg-cosmic-blue hover:bg-cosmic-blue/80 text-mystic-gold border border-mystic-gold/30">
                  <Layers className="mr-2 h-4 w-4" />
                  Deck Builder
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cosmic-blue/40 to-midnight/40 border border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-mystic-gold">
                <Trophy className="mr-2 h-5 w-5" />
                Rankings & Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-silver/70 mb-4">
                Current Rank: {user.currentRank || "Cadet"}
              </p>
              <Button className="w-full bg-cosmic-blue hover:bg-cosmic-blue/80 text-mystic-gold border border-mystic-gold/30">
                <Trophy className="mr-2 h-4 w-4" />
                View Leaderboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Development Tools */}
        <div className="mt-12 text-center">
          <Card className="bg-cosmic-blue/30 border-amber/30 inline-block">
            <CardContent className="p-4">
              <p className="text-amber/70 mb-2">Development Mode</p>
              <Button 
                onClick={() => initDataMutation.mutate()}
                disabled={initDataMutation.isPending}
                variant="outline"
                className="border-amber text-amber hover:bg-amber hover:text-space-black"
              >
                {initDataMutation.isPending ? "Initializing..." : "Initialize Game Data"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
