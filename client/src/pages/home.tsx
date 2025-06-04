import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/ui/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sword, 
  Trophy, 
  Group, 
  Layers, 
  Gift, 
  TrendingUp, 
  Star,
  Zap,
  Target,
  Users
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const { data: userGames } = useQuery({
    queryKey: ["/api/user/games"],
    enabled: !!user,
  });

  const { data: boosterPacks } = useQuery({
    queryKey: ["/api/user/booster-packs"],
    enabled: !!user,
  });

  const availablePacks = boosterPacks?.filter(pack => !pack.isOpened)?.length || 0;
  const experienceToNext = 1000; // This would be calculated based on level
  const currentExp = user?.experience || 0;
  const expProgress = (currentExp % experienceToNext) / experienceToNext * 100;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4 cosmic-text-glow">
            Welcome Back, Commander
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your fleet awaits your command. Choose your next mission.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{user?.level || 1}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-500">{userStats?.winRate || 0}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Group className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-500">{userStats?.cardsCollected || 0}</div>
              <div className="text-sm text-muted-foreground">Cards</div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-500">{availablePacks}</div>
              <div className="text-sm text-muted-foreground">Packs</div>
            </CardContent>
          </Card>
        </div>

        {/* Experience Progress */}
        <Card className="cosmic-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level Progress</span>
              <span className="text-sm text-muted-foreground">
                Level {user?.level || 1} • {user?.experience || 0} / {experienceToNext} XP
              </span>
            </div>
            <Progress value={expProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Battle */}
          <Card className="cosmic-card group cursor-pointer hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sword className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-primary">Quick Battle</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="mb-4">
                Jump into battle against AI opponents with varying difficulty levels
              </CardDescription>
              <div className="flex justify-center space-x-2 mb-4">
                <Badge variant="secondary" className="bg-green-600 text-white">Easy</Badge>
                <Badge variant="secondary" className="bg-yellow-600 text-white">Medium</Badge>
                <Badge variant="secondary" className="bg-red-600 text-white">Hard</Badge>
              </div>
              <Link href="/game">
                <Button className="w-full cosmic-button">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Battle
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Ranked Battle */}
          <Card className="cosmic-card group cursor-pointer hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-primary">Ranked Battle</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="mb-4">
                Compete against other commanders for galactic supremacy
              </CardDescription>
              <Badge className="mb-4 bg-gradient-to-r from-primary to-yellow-400 text-black">
                Current Rank: {user?.currentRank || "Recruit"}
              </Badge>
              <Button className="w-full cosmic-button" disabled>
                <Users className="w-4 h-4 mr-2" />
                Find Match (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Group */}
          <Card className="cosmic-card group cursor-pointer hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Group className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-primary">Group</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="mb-4">
                Browse your card collection and manage your fleet
              </CardDescription>
              <div className="text-primary font-semibold mb-4">
                {userStats?.cardsCollected || 0} Cards Collected
              </div>
              <Link href="/collection">
                <Button className="w-full cosmic-button-secondary">
                  <Layers className="w-4 h-4 mr-2" />
                  View Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Games */}
          <Card className="cosmic-card">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recent Battles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userGames && userGames.length > 0 ? (
                <div className="space-y-3">
                  {userGames.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {game.gameType === 'ai' ? 'AI Battle' : 'Ranked Match'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(game.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge 
                        variant={game.winnerId === user?.id ? "default" : "destructive"}
                        className={game.winnerId === user?.id ? "bg-green-600" : ""}
                      >
                        {game.winnerId === user?.id ? "Victory" : "Defeat"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sword className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No battles yet. Start your first game!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="cosmic-card">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/deck-builder">
                <Button className="w-full cosmic-button-secondary justify-start">
                  <Layers className="w-4 h-4 mr-2" />
                  Build Deck
                </Button>
              </Link>
              
              <Button 
                className="w-full cosmic-button-secondary justify-start"
                disabled={availablePacks === 0}
              >
                <Gift className="w-4 h-4 mr-2" />
                Open Booster Pack ({availablePacks})
              </Button>
              
              <Link href="/rankings">
                <Button className="w-full cosmic-button-secondary justify-start">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Rankings
                </Button>
              </Link>
              
              <Button className="w-full cosmic-button justify-start">
                <Star className="w-4 h-4 mr-2" />
                Daily Challenge (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
