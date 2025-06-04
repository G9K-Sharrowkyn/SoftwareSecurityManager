import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarBackground from "@/components/game/StarBackground";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen starfield-background relative">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-gradient-to-r from-space-black/80 via-cosmic-blue/80 to-space-black/80 backdrop-blur-md border-b border-mystic-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-mystic-gold animate-glow">
                <i className="fas fa-star-and-crescent mr-2"></i>
                Proteus Nebula
              </div>
              <div className="hidden md:block text-sm text-star-silver/70">
                Battle Card Game
              </div>
            </div>
            
            <Button onClick={handleLogin} disabled={isLoading} className="button-cosmic">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-space-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-rocket mr-2"></i>
                  Launch Into Battle
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          
          {/* Hero Content */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold via-amber to-mystic-gold mb-8 animate-glow">
              Proteus Nebula
            </h1>
            <p className="text-xl md:text-2xl text-star-silver mb-8 max-w-4xl mx-auto leading-relaxed">
              Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, 
              and dominate the galaxy in this immersive space-themed card battle game.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button onClick={handleLogin} size="lg" className="button-cosmic text-lg px-12 py-4">
                <i className="fas fa-rocket mr-3"></i>
                Begin Your Journey
              </Button>
              <Button variant="outline" size="lg" className="button-cosmic-secondary text-lg px-12 py-4">
                <i className="fas fa-play mr-3"></i>
                Watch Trailer
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Strategic Combat */}
            <Card className="card-cosmic group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                  <i className="fas fa-chess text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-mystic-gold mb-4">Strategic Combat</h3>
                <p className="text-star-silver/80 leading-relaxed">
                  Master the 3-phase battle system: Command, Deployment, and Battle. 
                  Every decision shapes the fate of your galactic empire.
                </p>
              </CardContent>
            </Card>

            {/* Card Collection */}
            <Card className="card-cosmic group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                  <i className="fas fa-layer-group text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-mystic-gold mb-4">Vast Collection</h3>
                <p className="text-star-silver/80 leading-relaxed">
                  Discover hundreds of unique cards featuring spaceships, aliens, 
                  and cosmic technologies. Build the ultimate deck for victory.
                </p>
              </CardContent>
            </Card>

            {/* Multiplayer */}
            <Card className="card-cosmic group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                  <i className="fas fa-users text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-mystic-gold mb-4">Epic Battles</h3>
                <p className="text-star-silver/80 leading-relaxed">
                  Challenge AI opponents or face other commanders in real-time multiplayer battles. 
                  Climb the ranks and become a legend.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Features */}
          <div className="bg-gradient-to-r from-cosmic-blue/20 to-midnight/20 rounded-2xl p-12 border border-mystic-gold/20 backdrop-blur-sm">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-mystic-gold mb-4">Game Features</h2>
              <p className="text-star-silver/80 text-lg max-w-3xl mx-auto">
                Experience the most immersive space card battle game ever created
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Advanced AI</h4>
                    <p className="text-star-silver/80">Challenge AI opponents with varying difficulty levels and strategic depth.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-gift text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Booster Packs</h4>
                    <p className="text-star-silver/80">Open exciting booster packs to discover rare and legendary cards.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-trophy text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Ranked Play</h4>
                    <p className="text-star-silver/80">Compete in ranked matches and climb the galactic leaderboards.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-hammer text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Deck Builder</h4>
                    <p className="text-star-silver/80">Create and customize your perfect deck with our advanced deck building tools.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-chart-line text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Progress System</h4>
                    <p className="text-star-silver/80">Level up your commander, unlock achievements, and earn rewards.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mystic-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-comments text-mystic-gold text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-mystic-gold mb-2">Community</h4>
                    <p className="text-star-silver/80">Connect with other players, share strategies, and join tournaments.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-mystic-gold/10 to-amber/10 rounded-2xl p-12 border border-mystic-gold/30">
              <h2 className="text-4xl font-bold text-mystic-gold mb-4">Ready to Command the Galaxy?</h2>
              <p className="text-star-silver/80 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of commanders already battling across the Proteus Nebula. 
                Your destiny among the stars awaits.
              </p>
              <Button onClick={handleLogin} size="lg" className="button-cosmic text-xl px-16 py-6">
                <i className="fas fa-rocket mr-3"></i>
                Start Playing Now
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-space-black/90 to-cosmic-blue/90 backdrop-blur-md border-t border-mystic-gold/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-star-silver/60">
            © 2024 Proteus Nebula. Built with passion for strategic card gaming.
          </p>
        </div>
      </footer>
    </div>
  );
}
