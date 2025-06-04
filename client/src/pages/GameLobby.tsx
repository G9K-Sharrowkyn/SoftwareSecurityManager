import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import BoosterPack from "@/components/cards/BoosterPack";

export default function GameLobby() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    retry: false,
  });

  const { data: decks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/decks"],
    retry: false,
  });

  const { data: boosterPacks, isLoading: packsLoading } = useQuery({
    queryKey: ["/api/booster-packs"],
    retry: false,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: { isVsAI: boolean; aiDifficulty?: string }) => {
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

  const createBoosterPackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs", {
        packType: "standard"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Success",
        description: "Booster pack acquired!",
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
        description: "Failed to acquire booster pack",
        variant: "destructive",
      });
    },
  });

  const startQuickMatch = () => {
    createGameMutation.mutate({
      isVsAI: true,
      aiDifficulty: selectedDifficulty
    });
  };

  const activeDeck = decks?.find((deck: any) => deck.isActive);
  const unclaimedPacks = boosterPacks?.filter((pack: any) => !pack.isOpened) || [];

  if (gamesLoading || decksLoading || packsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6">
          Command Center
        </h1>
        <p className="text-xl text-cosmic-silver mb-8 max-w-2xl mx-auto">
          Welcome back, Commander {user?.firstName || ""}. Choose your mission and lead your fleet to victory.
        </p>
      </div>

      {/* Player Stats */}
      <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30 mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-cosmic-gold">{user?.wins || 0}</div>
              <div className="text-cosmic-silver">Victories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-gold">{user?.level || 1}</div>
              <div className="text-cosmic-silver">Level</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-gold">{user?.credits || 0}</div>
              <div className="text-cosmic-silver">Credits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-gold">
                {user?.wins && user?.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
              </div>
              <div className="text-cosmic-silver">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Modes */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold flex items-center">
                <i className="fas fa-sword mr-2"></i>
                Quick Battle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-cosmic-silver">
                Jump into battle against AI opponents with varying difficulty levels.
              </p>
              
              <div>
                <label className="text-cosmic-silver mb-2 block">AI Difficulty:</label>
                <div className="flex space-x-2">
                  {["easy", "medium", "hard"].map((difficulty) => (
                    <Button
                      key={difficulty}
                      variant={selectedDifficulty === difficulty ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(difficulty as any)}
                      className={selectedDifficulty === difficulty 
                        ? "bg-cosmic-gold text-cosmic-900" 
                        : "border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                      }
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={startQuickMatch}
                disabled={createGameMutation.isPending || !activeDeck}
                className="w-full bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark hover:from-cosmic-gold-dark hover:to-cosmic-gold text-cosmic-900 font-bold"
              >
                {createGameMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Battle...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket mr-2"></i>
                    Launch Battle
                  </>
                )}
              </Button>

              {!activeDeck && (
                <p className="text-amber-400 text-sm">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  You need to select an active deck before starting a game.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader>
              <CardTitle className="text-cosmic-blue flex items-center">
                <i className="fas fa-users mr-2"></i>
                Multiplayer Arena
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cosmic-silver mb-4">
                Challenge other commanders in ranked battles and climb the leaderboards.
              </p>
              <Button 
                disabled 
                className="w-full bg-cosmic-blue/50 text-cosmic-silver"
              >
                <i className="fas fa-hammer mr-2"></i>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Deck */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold flex items-center">
                <i className="fas fa-layer-group mr-2"></i>
                Active Deck
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDeck ? (
                <div>
                  <h3 className="font-semibold text-cosmic-silver mb-2">{activeDeck.name}</h3>
                  <p className="text-cosmic-silver/70 text-sm mb-4">
                    {activeDeck.cards?.length || 0} cards
                  </p>
                  <Button
                    onClick={() => setLocation("/deck-builder")}
                    variant="outline"
                    className="w-full border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Deck
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-amber-400 text-2xl mb-2"></i>
                  <p className="text-cosmic-silver mb-4">No active deck selected</p>
                  <Button
                    onClick={() => setLocation("/deck-builder")}
                    className="w-full bg-cosmic-gold text-cosmic-900"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Deck
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booster Packs */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center">
                <i className="fas fa-gift mr-2"></i>
                Booster Packs
                {unclaimedPacks.length > 0 && (
                  <Badge className="ml-2 bg-purple-600">{unclaimedPacks.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-cosmic-silver text-sm">
                Open booster packs to discover new cards for your collection.
              </p>
              
              {unclaimedPacks.length > 0 ? (
                <div className="space-y-2">
                  {unclaimedPacks.slice(0, 3).map((pack: any) => (
                    <BoosterPack key={pack.id} pack={pack} />
                  ))}
                </div>
              ) : (
                <p className="text-cosmic-silver/70 text-sm text-center py-4">
                  No unopened packs available
                </p>
              )}

              <Button
                onClick={() => createBoosterPackMutation.mutate()}
                disabled={createBoosterPackMutation.isPending || (user?.credits || 0) < 100}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {createBoosterPackMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Acquiring...
                  </>
                ) : (
                  <>
                    <i className="fas fa-coins mr-2"></i>
                    Buy Pack (100 Credits)
                  </>
                )}
              </Button>

              {(user?.credits || 0) < 100 && (
                <p className="text-amber-400 text-xs text-center">
                  Insufficient credits
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm border-cosmic-600">
            <CardHeader>
              <CardTitle className="text-cosmic-silver flex items-center">
                <i className="fas fa-history mr-2"></i>
                Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {games && games.length > 0 ? (
                <div className="space-y-2">
                  {games.slice(0, 5).map((game: any) => (
                    <div key={game.id} className="flex justify-between items-center p-2 bg-cosmic-700/30 rounded">
                      <div className="text-sm">
                        <div className="text-cosmic-silver">
                          {game.isVsAI ? `vs AI (${game.aiDifficulty})` : "vs Player"}
                        </div>
                        <div className="text-cosmic-silver/70 text-xs">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={game.winnerId === user?.id ? "default" : "destructive"}
                        className={game.winnerId === user?.id 
                          ? "bg-green-600" 
                          : game.status === "finished" 
                            ? "bg-red-600" 
                            : "bg-amber-600"
                        }
                      >
                        {game.winnerId === user?.id ? "Won" : game.status === "finished" ? "Lost" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cosmic-silver/70 text-sm text-center py-4">
                  No games played yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
