import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarBackground from "@/components/StarBackground";
import BoosterPack from "@/components/BoosterPack";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showBoosterPack, setShowBoosterPack] = useState(false);

  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    retry: false,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const { data: userBoosterPacks } = useQuery({
    queryKey: ["/api/user-booster-packs"],
    retry: false,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: { isAIGame: boolean; aiDifficulty?: string }) => {
      const response = await apiRequest("POST", "/api/games", gameData);
      return response.json();
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <div className="text-cosmic-gold">Loading...</div>
      </div>
    );
  }

  const handleStartGame = (difficulty: string) => {
    createGameMutation.mutate({ isAIGame: true, aiDifficulty: difficulty });
  };

  const winRate = user?.totalWins && user?.totalLosses 
    ? Math.round((user.totalWins / (user.totalWins + user.totalLosses)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-cosmic-black text-cosmic-silver relative">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-cosmic-blue/90 backdrop-blur-md border-b border-cosmic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-rocket text-cosmic-gold text-2xl"></i>
                <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <i className="fas fa-home mr-2"></i>Dashboard
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/collection')}>
                <i className="fas fa-layer-group mr-2"></i>Collection
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/deck-builder')}>
                <i className="fas fa-edit mr-2"></i>Deck Builder
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-cosmic-blue/50 px-3 py-2 rounded-lg">
                <i className="fas fa-coins text-cosmic-gold"></i>
                <span className="text-sm font-semibold">{user?.credits || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-cosmic-gold/20 flex items-center justify-center">
                  <i className="fas fa-user text-cosmic-gold"></i>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{user?.username}</div>
                  <div className="text-xs text-cosmic-silver/70">Level {user?.level}</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                <i className="fas fa-sign-out-alt mr-2"></i>Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-glow">
            Welcome, Commander
          </h1>
          <p className="text-xl text-cosmic-silver mb-8 max-w-2xl mx-auto">
            Ready your fleet and prepare for battle. The galaxy awaits your command.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 hover:border-cosmic-gold transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <i className="fas fa-robot text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-4">Quick Battle</h3>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStartGame('Easy')}
                >
                  Easy AI
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStartGame('Medium')}
                >
                  Medium AI
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStartGame('Hard')}
                >
                  Hard AI
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 hover:border-cosmic-gold transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <i className="fas fa-users text-cosmic-black text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Multiplayer</h3>
              <p className="text-cosmic-silver mb-4">Challenge other commanders</p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="bg-cosmic-blue/20 border-cosmic-gold/30 hover:border-cosmic-gold transition-colors cursor-pointer group"
            onClick={() => setLocation('/collection')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <i className="fas fa-layer-group text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Collection</h3>
              <p className="text-cosmic-silver mb-4">Browse your cards</p>
              <Button className="w-full">
                View Collection
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="bg-cosmic-blue/20 border-cosmic-gold/30 hover:border-cosmic-gold transition-colors cursor-pointer group"
            onClick={() => setShowBoosterPack(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <i className="fas fa-gift text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Booster Packs</h3>
              <p className="text-cosmic-silver mb-4">
                Unopened: {userBoosterPacks?.length || 0}
              </p>
              <Button className="w-full">
                Open Packs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Player Stats */}
        <Card className="bg-cosmic-blue/20 border-cosmic-gold/30 mb-12">
          <CardHeader>
            <CardTitle className="text-cosmic-gold text-center">Commander Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-cosmic-gold">{user?.totalWins || 0}</div>
                <div className="text-cosmic-silver">Total Wins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cosmic-gold">{winRate}%</div>
                <div className="text-cosmic-silver">Win Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cosmic-gold">{user?.level || 1}</div>
                <div className="text-cosmic-silver">Level</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cosmic-gold">{user?.experience || 0}</div>
                <div className="text-cosmic-silver">Experience</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Games & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              {gamesLoading ? (
                <div className="text-cosmic-silver">Loading games...</div>
              ) : userGames?.length > 0 ? (
                <div className="space-y-4">
                  {userGames.slice(0, 5).map((game: any) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-cosmic-black/30 rounded">
                      <div>
                        <div className="text-cosmic-silver">
                          {game.isAIGame ? `vs AI (${game.aiDifficulty})` : 'vs Player'}
                        </div>
                        <div className="text-xs text-cosmic-silver/70">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={game.winnerId === user?.id ? "default" : "destructive"}>
                        {game.winnerId === user?.id ? "Won" : "Lost"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-cosmic-silver text-center py-8">
                  No games played yet. Start your first battle!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/20 border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="text-cosmic-silver">Loading leaderboard...</div>
              ) : (
                <div className="space-y-3">
                  {leaderboard?.slice(0, 10).map((player: any, index: number) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-cosmic-black/30 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="text-cosmic-gold font-bold">#{index + 1}</div>
                        <div>
                          <div className="text-cosmic-silver">{player.username}</div>
                          <div className="text-xs text-cosmic-silver/70">Level {player.level}</div>
                        </div>
                      </div>
                      <div className="text-cosmic-gold font-semibold">{player.totalWins} wins</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Booster Pack Modal */}
      {showBoosterPack && (
        <BoosterPack onClose={() => setShowBoosterPack(false)} />
      )}
    </div>
  );
}
