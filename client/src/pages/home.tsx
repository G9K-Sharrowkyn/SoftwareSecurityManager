import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import StarBackground from "@/components/ui/star-background";
import Navigation from "@/components/ui/navigation";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: matches } = useQuery({
    queryKey: ["/api/matches"],
    retry: false,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/booster-packs"],
    retry: false,
  });

  const createAIMatchMutation = useMutation({
    mutationFn: async (difficulty: string) => {
      const response = await apiRequest("POST", "/api/matches/ai", { difficulty });
      return response.json();
    },
    onSuccess: (match) => {
      window.location.href = `/game/${match.id}`;
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
        description: "Failed to create match",
        variant: "destructive",
      });
    },
  });

  const buyBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/booster-packs/buy");
      return response.json();
    },
    onSuccess: () => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentMatches = matches?.slice(0, 5) || [];
  const unopenedPacks = boosterPacks?.filter((pack: any) => !pack.opened) || [];
  const winRate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0;

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold mb-2 animate-glow">
            Welcome back, {user.username}!
          </h1>
          <p className="text-foreground/70">
            Ready to command your fleet across the Proteus Nebula?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cosmic-gold">{user.level}</div>
              <div className="text-sm text-foreground/70">Level</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{user.wins}</div>
              <div className="text-sm text-foreground/70">Wins</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-cosmic-gold">{winRate}%</div>
              <div className="text-sm text-foreground/70">Win Rate</div>
            </CardContent>
          </Card>
          
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400">{user.credits}</div>
              <div className="text-sm text-foreground/70">Credits</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Quick Battle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => createAIMatchMutation.mutate("easy")}
                  disabled={createAIMatchMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white justify-start"
                >
                  <i className="fas fa-robot mr-2"></i>
                  vs AI - Easy
                  <Badge variant="secondary" className="ml-auto">
                    Beginner
                  </Badge>
                </Button>
                
                <Button 
                  onClick={() => createAIMatchMutation.mutate("medium")}
                  disabled={createAIMatchMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white justify-start"
                >
                  <i className="fas fa-robot mr-2"></i>
                  vs AI - Medium
                  <Badge variant="secondary" className="ml-auto">
                    Intermediate
                  </Badge>
                </Button>
                
                <Button 
                  onClick={() => createAIMatchMutation.mutate("hard")}
                  disabled={createAIMatchMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white justify-start"
                >
                  <i className="fas fa-robot mr-2"></i>
                  vs AI - Hard
                  <Badge variant="secondary" className="ml-auto">
                    Expert
                  </Badge>
                </Button>
                
                <Button variant="outline" className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black justify-start">
                  <i className="fas fa-users mr-2"></i>
                  Find Multiplayer Match
                  <Badge variant="secondary" className="ml-auto">
                    Coming Soon
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Collection & Shop */}
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Collection & Shop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-space-black/30 rounded-lg">
                <div>
                  <div className="font-semibold">Booster Packs</div>
                  <div className="text-sm text-foreground/70">
                    {unopenedPacks.length} unopened pack{unopenedPacks.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {unopenedPacks.length > 0 && (
                    <Link href="/collection">
                      <Button size="sm" variant="outline" className="border-cosmic-gold text-cosmic-gold">
                        Open
                      </Button>
                    </Link>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => buyBoosterMutation.mutate()}
                    disabled={buyBoosterMutation.isPending || user.credits < 100}
                    className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black"
                  >
                    Buy (100 <i className="fas fa-coins"></i>)
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/collection">
                  <Button variant="outline" className="w-full border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black">
                    <i className="fas fa-layer-group mr-2"></i>
                    View Collection
                  </Button>
                </Link>
                
                <Link href="/deck-builder">
                  <Button variant="outline" className="w-full border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black">
                    <i className="fas fa-hammer mr-2"></i>
                    Build Deck
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches */}
        <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mt-8">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="text-foreground/70 text-center py-8">
                No matches yet. Start your first battle!
              </p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match: any) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-space-black/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        match.status === "completed" 
                          ? match.winnerId === user.id ? "bg-green-500" : "bg-red-500"
                          : "bg-yellow-500"
                      }`}></div>
                      <div>
                        <div className="font-semibold">
                          {match.isAIMatch ? `AI Match (${match.aiDifficulty})` : 'Multiplayer Match'}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {new Date(match.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      match.status === "completed" 
                        ? match.winnerId === user.id ? "default" : "destructive"
                        : "secondary"
                    }>
                      {match.status === "completed" 
                        ? match.winnerId === user.id ? "Victory" : "Defeat"
                        : "In Progress"
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
