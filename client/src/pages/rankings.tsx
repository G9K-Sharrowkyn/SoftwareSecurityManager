import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StarBackground from "@/components/ui/star-background";
import Navigation from "@/components/ui/navigation";

export default function Rankings() {
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

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  if (isLoading || leaderboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const rankings = leaderboard || [];
  const userRank = rankings.findIndex((player: any) => player.id === user.id) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { icon: "fas fa-crown", color: "text-yellow-400" };
      case 2: return { icon: "fas fa-medal", color: "text-gray-300" };
      case 3: return { icon: "fas fa-award", color: "text-yellow-600" };
      default: return { icon: "fas fa-hashtag", color: "text-cosmic-gold" };
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) return "default";
    if (rank <= 10) return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold animate-glow">
            <i className="fas fa-trophy mr-3"></i>
            Galactic Rankings
          </h1>
          {userRank > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Your Rank: #{userRank}
            </Badge>
          )}
        </div>

        {/* Top 3 Podium */}
        {rankings.length >= 3 && (
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 mb-8">
            <CardHeader>
              <CardTitle className="text-cosmic-gold text-center">
                Elite Commanders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-end space-x-8">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-gray-300">
                      <AvatarImage src={rankings[1]?.profileImageUrl} />
                      <AvatarFallback className="bg-gray-300 text-space-black text-xl">
                        {rankings[1]?.username?.charAt(0) || "2"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <i className="fas fa-medal text-gray-700"></i>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{rankings[1]?.username}</h3>
                  <p className="text-sm text-foreground/70">{rankings[1]?.wins} wins</p>
                  <p className="text-sm text-green-400">{rankings[1]?.winRate}% win rate</p>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-yellow-400">
                      <AvatarImage src={rankings[0]?.profileImageUrl} />
                      <AvatarFallback className="bg-yellow-400 text-space-black text-2xl">
                        {rankings[0]?.username?.charAt(0) || "1"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <i className="fas fa-crown text-yellow-800"></i>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-yellow-400">{rankings[0]?.username}</h3>
                  <p className="text-sm text-foreground/70">{rankings[0]?.wins} wins</p>
                  <p className="text-sm text-green-400">{rankings[0]?.winRate}% win rate</p>
                  <Badge className="mt-2 bg-yellow-400 text-space-black">Champion</Badge>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-yellow-600">
                      <AvatarImage src={rankings[2]?.profileImageUrl} />
                      <AvatarFallback className="bg-yellow-600 text-space-black text-xl">
                        {rankings[2]?.username?.charAt(0) || "3"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                      <i className="fas fa-award text-yellow-800"></i>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{rankings[2]?.username}</h3>
                  <p className="text-sm text-foreground/70">{rankings[2]?.wins} wins</p>
                  <p className="text-sm text-green-400">{rankings[2]?.winRate}% win rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-cosmic-blue/30 border-cosmic-gold/30">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">
              <i className="fas fa-list mr-2"></i>
              Full Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-trophy text-6xl text-cosmic-gold/30 mb-4"></i>
                <h3 className="text-xl font-semibold text-cosmic-gold mb-2">No Rankings Yet</h3>
                <p className="text-foreground/70">
                  Be the first to compete and claim your place in the galaxy!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankings.map((player: any, index: number) => {
                  const rank = index + 1;
                  const rankInfo = getRankIcon(rank);
                  const isCurrentUser = player.id === user.id;
                  
                  return (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                        isCurrentUser 
                          ? "bg-cosmic-gold/20 border border-cosmic-gold/50" 
                          : "bg-space-black/30 hover:bg-space-black/50"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant={getRankBadge(rank)} className="w-12 h-8 flex items-center justify-center">
                            <i className={`${rankInfo.icon} ${rankInfo.color} mr-1`}></i>
                            {rank}
                          </Badge>
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={player.profileImageUrl} />
                            <AvatarFallback className="bg-cosmic-blue text-white">
                              {player.username?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold ${isCurrentUser ? "text-cosmic-gold" : ""}`}>
                              {player.username}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-foreground/70">
                            <span>Level {player.level}</span>
                            <span>•</span>
                            <span>{player.wins} wins</span>
                            <span>•</span>
                            <span>{player.losses} losses</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {player.winRate}%
                        </div>
                        <div className="text-sm text-foreground/70">
                          Win Rate
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
