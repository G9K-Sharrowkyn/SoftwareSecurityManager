import { useEffect, useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameInterface } from "@/components/game/GameInterface";
import { 
  Rocket, 
  Sword, 
  Trophy, 
  Users, 
  Zap, 
  Star,
  Play,
  Gift,
  LogOut,
  BarChart3,
  Settings,
  Bell
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  level: number;
  experience: number;
  credits: number;
  wins: number;
  losses: number;
}

interface Game {
  id: number;
  status: string;
  isVsAi: boolean;
  aiDifficulty?: string;
  currentPhase: string;
  currentTurn: number;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
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
  }, [isAuthenticated, toast]);

  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: userCollection, isLoading: collectionLoading } = useQuery({
    queryKey: ["/api/collection"],
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: userDecks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/decks"],
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: { isVsAi: boolean; aiDifficulty?: string }) => {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create game");
      return response.json();
    },
    onSuccess: (game) => {
      setCurrentGame(game);
      setActiveTab("game");
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Created",
        description: "Your battle awaits, Commander!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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

  const createBoosterMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/booster-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packType: "standard" }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create booster pack");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booster-packs"] });
      toast({
        title: "Booster Pack Acquired",
        description: "A new booster pack has been added to your collection!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to acquire booster pack.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const startQuickMatch = (difficulty: string = "medium") => {
    createGameMutation.mutate({
      isVsAi: true,
      aiDifficulty: difficulty
    });
  };

  const startRankedMatch = () => {
    createGameMutation.mutate({
      isVsAi: false
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your command center...</p>
        </div>
      </div>
    );
  }

  if (currentGame && activeTab === "game") {
    return <GameInterface game={currentGame} onExit={() => {
      setCurrentGame(null);
      setActiveTab("dashboard");
    }} />;
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Rocket className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Proteus Nebula</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("dashboard")}
                className={activeTab === "dashboard" ? "text-primary" : ""}
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("collection")}
                className={activeTab === "collection" ? "text-primary" : ""}
              >
                Collection
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("leaderboard")}
                className={activeTab === "leaderboard" ? "text-primary" : ""}
              >
                Rankings
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3 bg-card border border-border rounded-lg px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold">
                    {user.firstName || user.email || "Commander"}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {user.level}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold text-yellow-400">{user.credits}</span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden md:grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="deck-builder">Deck Builder</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 mb-4">
                Command Center
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Your galactic empire awaits. Choose your battle and lead your fleet to victory.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => startQuickMatch("easy")} 
                  className="cosmic-button"
                  disabled={createGameMutation.isPending}
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Quick Battle
                </Button>
                <Button 
                  onClick={startRankedMatch}
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={createGameMutation.isPending}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ranked Match
                </Button>
                <Button 
                  onClick={() => createBoosterMutation.mutate()}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  disabled={createBoosterMutation.isPending}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Open Pack
                </Button>
              </div>
            </div>

            {/* Game Modes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30 card-hover cursor-pointer" onClick={() => startQuickMatch("easy")}>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sword className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-center text-red-400">Quick Match</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Battle against AI opponents with varying difficulty levels
                  </CardDescription>
                  <div className="flex justify-center space-x-2">
                    <Badge variant="secondary" className="bg-green-600">Easy</Badge>
                    <Badge variant="secondary" className="bg-yellow-600">Medium</Badge>
                    <Badge variant="secondary" className="bg-red-600">Hard</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-500/30 card-hover cursor-pointer" onClick={startRankedMatch}>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-center text-primary">Ranked Battle</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Compete against other commanders for galactic supremacy
                  </CardDescription>
                  <Badge variant="outline" className="border-primary text-primary">
                    Current Rank: Captain
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 card-hover cursor-pointer" onClick={() => setActiveTab("collection")}>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-center text-blue-400">Collection</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Browse your card collection and manage your fleet
                  </CardDescription>
                  <div className="text-primary font-semibold">
                    {userCollection?.length || 0} Cards Collected
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Player Stats */}
            <Card className="bg-gradient-to-r from-card/50 to-card/30 border-border">
              <CardHeader>
                <CardTitle className="text-center text-primary">Commander Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">{user.wins}</div>
                    <div className="text-muted-foreground">Total Wins</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
                    </div>
                    <div className="text-muted-foreground">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">{user.level}</div>
                    <div className="text-muted-foreground">Level</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">{user.experience}</div>
                    <div className="text-muted-foreground">Experience</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-4">Your Collection</h2>
              <p className="text-muted-foreground">
                {collectionLoading ? "Loading your cards..." : `You have ${userCollection?.length || 0} cards in your collection`}
              </p>
            </div>

            {collectionLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : userCollection && userCollection.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {userCollection.map((userCard: any) => (
                  <Card key={userCard.id} className="bg-card/60 border-border card-hover cursor-pointer">
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-t-lg flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <CardContent className="p-2">
                      <div className="text-sm font-semibold text-primary truncate">
                        {userCard.card.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        x{userCard.quantity}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Cards Yet</h3>
                <p className="text-muted-foreground mb-4">Start your collection by opening booster packs!</p>
                <Button onClick={() => createBoosterMutation.mutate()} className="cosmic-button">
                  <Gift className="w-4 h-4 mr-2" />
                  Get Your First Pack
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deck-builder" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-4">Deck Builder</h2>
              <p className="text-muted-foreground">
                Construct powerful decks to dominate the battlefield
              </p>
            </div>

            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">Deck Builder</h3>
              <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-4">Galactic Leaderboard</h2>
              <p className="text-muted-foreground">
                See how you rank among the galaxy's finest commanders
              </p>
            </div>

            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">Leaderboard</h3>
              <p className="text-muted-foreground">Rankings will be available soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
