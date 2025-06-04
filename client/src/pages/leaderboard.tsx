import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/layout/navigation";

export default function Leaderboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
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

  // Fetch leaderboard data
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: isAuthenticated,
  });

  if (isLoading || leaderboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Find current user's rank
  const userRank = leaderboard?.findIndex((player: any) => player.id === user?.id) + 1 || 0;

  return (
    <div className="min-h-screen relative z-10">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gold mb-4">Galactic Leaderboard</h1>
          <p className="text-cosmic-silver">
            Top commanders across the universe
          </p>
        </div>

        {/* User's Current Rank */}
        {userRank > 0 && (
          <Card className="bg-gradient-to-r from-cosmic-gold/20 to-cosmic-gold/10 border-cosmic-gold mb-8">
            <CardHeader>
              <CardTitle className="text-cosmic-gold text-center">Your Current Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">#{userRank}</div>
                  <div className="text-cosmic-silver">Global Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">{user?.wins || 0}</div>
                  <div className="text-cosmic-silver">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic-gold">
                    {user?.wins && user?.losses 
                      ? Math.round((user.wins / (user.wins + user.losses)) * 100)
                      : 0}%
                  </div>
                  <div className="text-cosmic-silver">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card className="bg-cosmic-800/50 border-cosmic-600">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">Top 100 Commanders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-cosmic-700/50 rounded-lg font-semibold text-cosmic-gold text-sm">
                <div>Rank</div>
                <div className="col-span-2">Commander</div>
                <div>Level</div>
                <div>Wins</div>
                <div>Win Rate</div>
              </div>

              {/* Leaderboard entries */}
              {leaderboard?.map((player: any, index: number) => (
                <div 
                  key={player.id}
                  className={`grid grid-cols-6 gap-4 py-3 px-4 rounded-lg transition-colors ${
                    player.id === user?.id 
                      ? "bg-cosmic-gold/20 border border-cosmic-gold" 
                      : "bg-cosmic-700/30 hover:bg-cosmic-700/50"
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`font-bold ${
                      index < 3 ? "text-cosmic-gold" : "text-cosmic-silver"
                    }`}>
                      #{index + 1}
                    </span>
                    {index === 0 && <i className="fas fa-crown text-yellow-400 ml-2"></i>}
                    {index === 1 && <i className="fas fa-medal text-gray-400 ml-2"></i>}
                    {index === 2 && <i className="fas fa-medal text-amber-600 ml-2"></i>}
                  </div>
                  
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cosmic-gold to-cosmic-gold-dark rounded-full flex items-center justify-center">
                      {player.profileImageUrl ? (
                        <img 
                          src={player.profileImageUrl} 
                          alt={player.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <i className="fas fa-user text-cosmic-900 text-sm"></i>
                      )}
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        player.id === user?.id ? "text-cosmic-gold" : "text-cosmic-silver"
                      }`}>
                        {player.username || `Commander ${player.id.slice(-4)}`}
                      </div>
                      <div className="text-xs text-cosmic-silver/70">
                        {player.firstName && player.lastName 
                          ? `${player.firstName} ${player.lastName}`
                          : "Anonymous"
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-cosmic-gold font-semibold">{player.level}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-cosmic-silver font-semibold">{player.wins}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${
                      player.winRate >= 70 ? "text-green-400" :
                      player.winRate >= 50 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {player.winRate}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {!leaderboard || leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-cosmic-silver text-lg">No commanders found</div>
                  <div className="text-cosmic-silver/70 text-sm">Be the first to claim the throne!</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Tiers */}
        <Card className="bg-cosmic-800/50 border-cosmic-600 mt-8">
          <CardHeader>
            <CardTitle className="text-cosmic-gold">Ranking Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <i className="fas fa-crown text-purple-400 text-2xl mb-2"></i>
                <div className="font-bold text-purple-400">Galactic Emperor</div>
                <div className="text-sm text-cosmic-silver">Top 10</div>
              </div>
              <div className="text-center p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <i className="fas fa-star text-blue-400 text-2xl mb-2"></i>
                <div className="font-bold text-blue-400">Fleet Admiral</div>
                <div className="text-sm text-cosmic-silver">Top 100</div>
              </div>
              <div className="text-center p-4 bg-green-600/20 rounded-lg border border-green-500/30">
                <i className="fas fa-rocket text-green-400 text-2xl mb-2"></i>
                <div className="font-bold text-green-400">Space Captain</div>
                <div className="text-sm text-cosmic-silver">Everyone else</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
