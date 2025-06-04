import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/ui/navigation";
import { Rocket, Sword, Trophy, Users, Gift, Layers, Play, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/collection"],
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameType: string) => {
      const response = await apiRequest("POST", "/api/games", { gameType });
      return response.json();
    },
    onSuccess: (game) => {
      setLocation(`/game/${game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const createBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Success",
        description: "Booster pack added to your collection!",
        variant: "default",
      });
    },
  });

  const handleQuickMatch = () => {
    createGameMutation.mutate('ai');
  };

  const handleRankedMatch = () => {
    createGameMutation.mutate('ranked');
  };

  const winRate = user?.wins && user?.losses 
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            Welcome Back, Commander
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready to command your fleet and conquer the galaxy?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30 hover:border-red-400 transition-all duration-300 cursor-pointer" 
                onClick={handleQuickMatch}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-red-400">Quick Match</CardTitle>
              <CardDescription>Battle against AI opponents</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-primary/30 to-amber-500/30 border-primary/30 hover:border-primary transition-all duration-300 cursor-pointer"
                onClick={handleRankedMatch}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-primary">Ranked Battle</CardTitle>
              <CardDescription>Compete for galactic supremacy</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30 hover:border-blue-400 transition-all duration-300 cursor-pointer"
                onClick={() => setLocation("/collection")}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-blue-400">Collection</CardTitle>
              <CardDescription>Browse your card collection</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30 hover:border-purple-400 transition-all duration-300 cursor-pointer"
                onClick={() => createBoosterMutation.mutate()}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-purple-400">Booster Pack</CardTitle>
              <CardDescription>Get a free booster pack</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Player Stats */}
        <Card className="bg-gradient-to-r from-card/50 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-primary">Commander Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{user?.level || 1}</div>
                <div className="text-muted-foreground">Level</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.wins || 0}</div>
                <div className="text-muted-foreground">Wins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{winRate}%</div>
                <div className="text-muted-foreground">Win Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.experience || 0}</div>
                <div className="text-muted-foreground">Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.credits || 0}</div>
                <div className="text-muted-foreground">Credits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Galactic Leaderboard</CardTitle>
            <CardDescription>Top commanders in the galaxy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard?.slice(0, 5).map((player: any, index: number) => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-semibold">{player.firstName || `Commander ${player.id.slice(-4)}`}</div>
                      <div className="text-sm text-muted-foreground">Level {player.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{player.wins} wins</div>
                    <div className="text-sm text-muted-foreground">{player.experience} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
