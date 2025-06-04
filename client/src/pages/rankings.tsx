import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Trophy, 
  Crown, 
  Medal,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

export default function Rankings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Fetch rankings
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["/api/rankings"],
  });

  // Find current user's rank
  const userRank = rankings?.findIndex((player: any) => player.id === user?.id) + 1 || null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">#{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black">Champion</Badge>;
    if (rank <= 3) return <Badge className="bg-primary">Elite</Badge>;
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>;
    if (rank <= 50) return <Badge variant="outline">Top 50</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary flex items-center">
                <Trophy className="w-8 h-8 mr-2" />
                Galactic Rankings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User's Current Rank */}
        {userRank && (
          <Card className="mb-8 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(userRank)}
                    <span className="text-2xl font-bold text-primary">Rank #{userRank}</span>
                  </div>
                  {getRankBadge(userRank)}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Your Stats</div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-400">{user?.totalWins || 0} Wins</span>
                    <span className="text-primary">{user?.experience || 0} XP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rankings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top 3 Podium */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              Hall of Champions
            </h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="loading-spinner w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading rankings...</p>
              </div>
            ) : rankings && rankings.length >= 3 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 2nd Place */}
                <Card className="bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-400/50 order-2 md:order-1">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Medal className="w-12 h-12 text-gray-400" />
                    </div>
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-gray-400">
                      <AvatarFallback className="bg-gray-600 text-white text-lg">
                        {rankings[1].firstName?.[0] || rankings[1].email?.[0] || "2"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{rankings[1].firstName || "Commander"}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Level {rankings[1].level}</p>
                    <div className="space-y-1 text-sm">
                      <div className="text-green-400">{rankings[1].totalWins} Wins</div>
                      <div className="text-primary">{rankings[1].experience} XP</div>
                    </div>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-400/50 transform scale-105 order-1 md:order-2">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Crown className="w-16 h-16 text-yellow-400" />
                    </div>
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-yellow-400">
                      <AvatarFallback className="bg-yellow-600 text-black text-xl">
                        {rankings[0].firstName?.[0] || rankings[0].email?.[0] || "1"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-xl text-yellow-400">{rankings[0].firstName || "Champion"}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Level {rankings[0].level}</p>
                    <Badge className="bg-yellow-500 text-black mb-3">Galactic Champion</Badge>
                    <div className="space-y-1 text-sm">
                      <div className="text-green-400">{rankings[0].totalWins} Wins</div>
                      <div className="text-yellow-400">{rankings[0].experience} XP</div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className="bg-gradient-to-br from-amber-600/20 to-amber-700/20 border-amber-600/50 order-3">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Medal className="w-12 h-12 text-amber-600" />
                    </div>
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-amber-600">
                      <AvatarFallback className="bg-amber-700 text-white text-lg">
                        {rankings[2].firstName?.[0] || rankings[2].email?.[0] || "3"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{rankings[2].firstName || "Commander"}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Level {rankings[2].level}</p>
                    <div className="space-y-1 text-sm">
                      <div className="text-green-400">{rankings[2].totalWins} Wins</div>
                      <div className="text-primary">{rankings[2].experience} XP</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rankings available</h3>
                <p className="text-muted-foreground">Be the first to start climbing the leaderboards!</p>
              </div>
            )}
          </div>

          {/* Full Rankings List */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Full Leaderboard
            </h2>
            
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="loading-spinner w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading full rankings...</p>
                  </div>
                ) : rankings && rankings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {rankings.map((player: any, index: number) => {
                      const rank = index + 1;
                      const isCurrentUser = player.id === user?.id;
                      const winRate = player.totalWins + player.totalLosses > 0 
                        ? Math.round((player.totalWins / (player.totalWins + player.totalLosses)) * 100)
                        : 0;

                      return (
                        <div
                          key={player.id}
                          className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                            isCurrentUser ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10">
                              {getRankIcon(rank)}
                            </div>
                            
                            <Avatar className="w-10 h-10 border border-border">
                              <AvatarFallback>
                                {player.firstName?.[0] || player.email?.[0] || rank}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                                  {player.firstName || `Commander ${player.id.slice(-4)}`}
                                </span>
                                {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                                {getRankBadge(rank)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Level {player.level} • {player.currentRank || 'Recruit'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-green-400">{player.totalWins}W</span>
                              <span className="text-red-400">{player.totalLosses}L</span>
                              <span className="text-primary">{winRate}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {player.experience} XP
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No players ranked yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start playing to appear on the leaderboards!
                    </p>
                    <Link href="/">
                      <Button>
                        <Zap className="w-4 h-4 mr-2" />
                        Start Playing
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
