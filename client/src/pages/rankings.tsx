import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import StarBackground from "@/components/ui/star-background";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

export default function Rankings() {
  const { user } = useAuth();

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "⭐";
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-400 border-yellow-400";
      case 2: return "text-gray-300 border-gray-300";
      case 3: return "text-amber-600 border-amber-600";
      default: return "text-cosmic-silver border-cosmic-600";
    }
  };

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-xl font-bold text-cosmic-gold">Proteus Nebula</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <a href="/game" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                  🎮 Game
                </a>
                <a href="/collection" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                  🎴 Collection
                </a>
                <a href="/deck-builder" className="text-cosmic-silver hover:text-cosmic-gold transition-colors duration-200 font-medium">
                  🏗️ Deck Builder
                </a>
                <a href="/rankings" className="text-cosmic-gold font-medium">
                  🏆 Rankings
                </a>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-cosmic-700 px-3 py-2 rounded-lg">
                  <span className="text-sm font-semibold text-cosmic-gold">💰 {user?.credits || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full border-2 border-cosmic-gold bg-cosmic-700 flex items-center justify-center">
                    <span className="text-cosmic-gold">👨‍🚀</span>
                  </div>
                  <span className="text-sm font-medium text-cosmic-silver">{user?.username || 'Commander'}</span>
                </div>
                <Button
                  onClick={() => window.location.href = "/api/logout"}
                  variant="outline"
                  size="sm"
                  className="border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold hover:text-cosmic-900"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen pt-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-4">
                Galactic Rankings
              </h1>
              <p className="text-xl text-cosmic-silver mb-8">
                The most skilled commanders across the nebula
              </p>
            </div>

            {/* Player's Current Rank */}
            {user && (
              <Card className="bg-cosmic-800/50 border border-cosmic-gold/30 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-cosmic-gold mb-4 text-center">Your Current Standing</h2>
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cosmic-gold">{user.wins || 0}</div>
                      <div className="text-cosmic-silver">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cosmic-gold">{user.losses || 0}</div>
                      <div className="text-cosmic-silver">Losses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cosmic-gold">
                        {user.wins && user.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
                      </div>
                      <div className="text-cosmic-silver">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cosmic-gold">{user.level || 1}</div>
                      <div className="text-cosmic-silver">Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-cosmic-800/50 border border-cosmic-600">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-cosmic-gold mb-6 text-center">Top Commanders</h2>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-gold mx-auto"></div>
                    <p className="text-cosmic-silver mt-4">Loading rankings...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold text-cosmic-gold mb-2">No Rankings Yet</h3>
                    <p className="text-cosmic-silver">Be the first to claim victory!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((player: User, index: number) => {
                      const rank = index + 1;
                      const winRate = player.wins && player.losses 
                        ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
                        : 0;
                      const isCurrentUser = user?.id === player.id;
                      
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                            isCurrentUser 
                              ? 'bg-cosmic-gold/20 border-cosmic-gold' 
                              : `bg-cosmic-700 ${getRankColor(rank)}`
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{getRankEmoji(rank)}</div>
                            <div className="text-2xl font-bold text-cosmic-gold">#{rank}</div>
                            <div className="w-12 h-12 rounded-full border-2 border-cosmic-gold bg-cosmic-700 flex items-center justify-center">
                              <span className="text-cosmic-gold">👨‍🚀</span>
                            </div>
                            <div>
                              <div className={`font-bold ${isCurrentUser ? 'text-cosmic-gold' : 'text-cosmic-silver'}`}>
                                {player.username || `Commander${player.id.slice(-4)}`}
                                {isCurrentUser && <span className="ml-2 text-sm">(You)</span>}
                              </div>
                              <div className="text-sm text-cosmic-silver/70">
                                Level {player.level || 1} • {player.experience || 0} XP
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-green-400">{player.wins || 0}</div>
                              <div className="text-cosmic-silver/70">Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-red-400">{player.losses || 0}</div>
                              <div className="text-cosmic-silver/70">Losses</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-cosmic-gold">{winRate}%</div>
                              <div className="text-cosmic-silver/70">Win Rate</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking Information */}
            <Card className="bg-cosmic-800/50 border border-cosmic-600 mt-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-cosmic-gold mb-4">How Rankings Work</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-cosmic-silver">
                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <h4 className="font-semibold text-cosmic-gold mb-2">Win Games</h4>
                    <p className="text-sm">Victory in battles earns you ranking points and experience</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📈</div>
                    <h4 className="font-semibold text-cosmic-gold mb-2">Gain Experience</h4>
                    <p className="text-sm">Level up your commander to unlock new abilities</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="font-semibold text-cosmic-gold mb-2">Climb Ranks</h4>
                    <p className="text-sm">Maintain your win rate to stay at the top</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
