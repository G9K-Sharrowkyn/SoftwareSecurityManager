import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/layout/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sword, 
  Trophy, 
  Package, 
  Layers, 
  Users, 
  Star,
  Zap,
  Crown,
  Target,
  Gift
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: userGames } = useQuery({
    queryKey: ["/api/user/games"],
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/user/achievements"],
  });

  const { data: rankings } = useQuery({
    queryKey: ["/api/rankings"],
  });

  const userRank = rankings?.findIndex((u: any) => u.id === user?.id) + 1 || 0;
  const winRate = user ? Math.round((user.totalWins / Math.max(user.totalWins + user.totalLosses, 1)) * 100) : 0;
  const nextLevelXP = user ? (user.level * 1000) : 1000;
  const progressToNextLevel = user ? (user.experience % 1000) / 10 : 0;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold mb-2">
            Welcome back, Commander {user?.firstName || 'Player'}
          </h1>
          <p className="text-gray-300">
            Ready to conquer the galaxy? Choose your next battle strategy.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cosmic-gold">{user?.level || 1}</div>
              <Progress value={progressToNextLevel} className="mt-2" />
              <p className="text-xs text-gray-400 mt-1">
                {user?.experience || 0} / {nextLevelXP} XP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{winRate}%</div>
              <p className="text-xs text-gray-400 mt-1">
                {user?.totalWins || 0}W / {user?.totalLosses || 0}L
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cosmic-gold">#{userRank || "—"}</div>
              <p className="text-xs text-gray-400 mt-1">
                {user?.currentRank || "Unranked"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{user?.credits || 0}</div>
              <p className="text-xs text-gray-400 mt-1">
                Galactic Currency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-cosmic-gold mb-4">Game Modes</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30 hover:border-cosmic-gold/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-cosmic-gold">
                    <Zap className="w-6 h-6 mr-3" />
                    Quick Battle
                  </CardTitle>
                  <CardDescription>
                    Jump into instant action against AI opponents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="border-green-500 text-green-400">Easy</Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">Medium</Badge>
                    <Badge variant="outline" className="border-red-500 text-red-400">Hard</Badge>
                  </div>
                  <Link href="/game">
                    <Button className="w-full bg-cosmic-blue hover:bg-cosmic-blue/90">
                      <Sword className="w-4 h-4 mr-2" />
                      Battle AI
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30 hover:border-cosmic-gold/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-cosmic-gold">
                    <Crown className="w-6 h-6 mr-3" />
                    Ranked Match
                  </CardTitle>
                  <CardDescription>
                    Compete for galactic supremacy and climb the ranks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Badge variant="outline" className="border-cosmic-gold text-cosmic-gold">
                      Current: {user?.currentRank || "Unranked"}
                    </Badge>
                  </div>
                  <Button className="w-full bg-cosmic-gold hover:bg-cosmic-gold/90 text-space-black font-bold">
                    <Trophy className="w-4 h-4 mr-2" />
                    Find Match
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-cosmic-gold mb-4">Collection & Decks</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30 hover:border-cosmic-gold/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-cosmic-gold">
                    <Package className="w-6 h-6 mr-3" />
                    Card Collection
                  </CardTitle>
                  <CardDescription>
                    Browse your cards and open booster packs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-300">Booster Packs:</span>
                    <Badge variant="outline" className="border-purple-500 text-purple-400">
                      <Gift className="w-3 h-3 mr-1" />
                      {user?.boosterPacks || 0}
                    </Badge>
                  </div>
                  <Link href="/collection">
                    <Button className="w-full" variant="outline">
                      <Star className="w-4 h-4 mr-2" />
                      View Collection
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30 hover:border-cosmic-gold/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-cosmic-gold">
                    <Layers className="w-6 h-6 mr-3" />
                    Deck Builder
                  </CardTitle>
                  <CardDescription>
                    Create and customize your battle decks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/deck-builder">
                    <Button className="w-full" variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Build Deck
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Recent Games & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              {userGames && userGames.length > 0 ? (
                <div className="space-y-3">
                  {userGames.slice(0, 5).map((game: any) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-space-black/30 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {game.isAiOpponent ? `AI (${game.aiDifficulty})` : 'Player vs Player'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </p>
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
                <p className="text-gray-400 text-center py-8">
                  No games played yet. Start your first battle!
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cosmic-blue/30">
            <CardHeader>
              <CardTitle className="text-cosmic-gold">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements && achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 5).map((userAchievement: any) => (
                    <div key={userAchievement.id} className="flex items-center p-3 bg-space-black/30 rounded-lg">
                      <Trophy className="w-8 h-8 text-cosmic-gold mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{userAchievement.achievement.name}</p>
                        <p className="text-sm text-gray-400">{userAchievement.achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Complete games to unlock achievements!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
