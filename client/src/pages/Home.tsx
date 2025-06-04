import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import StarBackground from '@/components/game/StarBackground';

const Home: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen relative">
      <StarBackground className="opacity-30" />
      
      {/* Navigation */}
      <nav className="relative z-10 bg-cosmic-blue/90 backdrop-blur-md border-b border-mystic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-mystic-gold">
                🚀 Proteus Nebula
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/game">
                <a className="text-star-silver hover:text-mystic-gold transition-colors">
                  Game
                </a>
              </Link>
              <Link href="/collection">
                <a className="text-star-silver hover:text-mystic-gold transition-colors">
                  Collection
                </a>
              </Link>
              <Link href="/deck-builder">
                <a className="text-star-silver hover:text-mystic-gold transition-colors">
                  Deck Builder
                </a>
              </Link>
              <Link href="/rankings">
                <a className="text-star-silver hover:text-mystic-gold transition-colors">
                  Rankings
                </a>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-cosmic-blue/50 rounded-lg px-4 py-2 border border-mystic-gold/30">
                <div className="w-8 h-8 rounded-full bg-mystic-gold/20 flex items-center justify-center">
                  👤
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold">{user?.username || 'Commander'}</div>
                  <div className="text-xs text-star-silver/70">Level {user?.level || 1}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-cosmic-blue/50 rounded-lg px-3 py-2 border border-amber/30">
                <span className="text-amber">💰</span>
                <span className="font-semibold text-amber">{user?.credits || 1000}</span>
              </div>

              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className="border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-star-silver mb-4">
            Welcome Back, Commander
          </h1>
          <p className="text-xl text-star-silver/80 max-w-2xl mx-auto">
            Your fleet awaits your orders. Choose your battle and lead your forces to victory across the cosmic frontier.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/game">
            <Card className="bg-cosmic-blue/40 border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-mystic-gold flex items-center">
                  ⚔️ Quick Battle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-silver/80 mb-4">
                  Jump into combat against AI opponents with varying difficulty levels
                </p>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="border-green-500 text-green-400">Easy</Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">Medium</Badge>
                  <Badge variant="outline" className="border-red-500 text-red-400">Hard</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/collection">
            <Card className="bg-cosmic-blue/40 border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-mystic-gold flex items-center">
                  📦 Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-silver/80 mb-4">
                  Browse your card collection and open booster packs
                </p>
                <div className="text-mystic-gold font-semibold">
                  {/* This would come from actual data */}
                  247 Cards Collected
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/deck-builder">
            <Card className="bg-cosmic-blue/40 border-mystic-gold/30 hover:border-mystic-gold transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-mystic-gold flex items-center">
                  🔧 Deck Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-silver/80 mb-4">
                  Construct and manage your battle decks
                </p>
                <div className="text-mystic-gold font-semibold">
                  3 Active Decks
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Player Stats */}
        <Card className="bg-cosmic-blue/20 border-mystic-gold/30 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-mystic-gold text-center">Commander Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-mystic-gold">{user?.totalWins || 0}</div>
                <div className="text-star-silver/70">Total Wins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-mystic-gold">
                  {user?.totalWins && user?.totalLosses 
                    ? Math.round((user.totalWins / (user.totalWins + user.totalLosses)) * 100)
                    : 0}%
                </div>
                <div className="text-star-silver/70">Win Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-mystic-gold">{user?.level || 1}</div>
                <div className="text-star-silver/70">Level</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-mystic-gold">{user?.experience || 0}</div>
                <div className="text-star-silver/70">Experience</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-cosmic-blue/20 border-mystic-gold/30">
          <CardHeader>
            <CardTitle className="text-xl text-mystic-gold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-space-black/30 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">🏆</span>
                  <span className="text-star-silver">Victory against AI Commander Zyx</span>
                </div>
                <span className="text-sm text-star-silver/50">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-space-black/30 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-400">📦</span>
                  <span className="text-star-silver">Opened Nebula Booster Pack</span>
                </div>
                <span className="text-sm text-star-silver/50">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-space-black/30 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-purple-400">⭐</span>
                  <span className="text-star-silver">Reached Level {user?.level || 1}</span>
                </div>
                <span className="text-sm text-star-silver/50">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Home;
