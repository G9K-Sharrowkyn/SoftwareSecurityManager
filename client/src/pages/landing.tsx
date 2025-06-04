import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarBackground from "@/components/ui/star-background";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-cosmic-blue/20 backdrop-blur-sm border-b border-cosmic-gold/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-cosmic-gold animate-glow">
                <i className="fas fa-rocket mr-2"></i>
                Proteus Nebula
              </div>
              <div className="hidden md:block text-sm text-foreground/70">
                Battle Card Game
              </div>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-transparent bg-clip-text cosmic-gradient animate-glow">
            Proteus Nebula
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy in this epic space-themed card game.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black font-bold px-8 py-4 text-lg animate-glow"
            >
              <i className="fas fa-rocket mr-2"></i>
              Start Your Journey
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-cosmic-gold text-cosmic-gold hover:bg-cosmic-gold hover:text-space-black px-8 py-4 text-lg"
            >
              <i className="fas fa-play mr-2"></i>
              Watch Trailer
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sword text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Strategic Combat</h3>
              <p className="text-foreground/70">
                Master the 3-phase battle system: Command, Deployment, and Battle. Every decision matters in your quest for galactic supremacy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-space-black text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Deck Building</h3>
              <p className="text-foreground/70">
                Collect hundreds of unique cards and craft the perfect deck. From mighty battleships to strategic command centers.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Multiplayer Battles</h3>
              <p className="text-foreground/70">
                Challenge players worldwide or test your skills against AI opponents with varying difficulty levels.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Ranked Progression</h3>
              <p className="text-foreground/70">
                Climb the leaderboards, earn achievements, and unlock exclusive cards as you prove your tactical superiority.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-gift text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Booster Packs</h3>
              <p className="text-foreground/70">
                Open exciting booster packs to discover rare and legendary cards that will enhance your collection.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-blue/30 border-cosmic-gold/30 hover:border-cosmic-gold transition-all duration-300 card-hover">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-rocket text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-cosmic-gold mb-2">Epic Lore</h3>
              <p className="text-foreground/70">
                Immerse yourself in the rich universe of Proteus Nebula, where ancient civilizations clash among the stars.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-cosmic-blue/20 border border-cosmic-gold/30 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-cosmic-gold mb-4">Ready to Begin?</h2>
            <p className="text-foreground/80 mb-6">
              Join thousands of commanders already exploring the Proteus Nebula. Your fleet awaits your command.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-space-black font-bold px-12 py-4 text-lg animate-glow"
            >
              <i className="fas fa-rocket mr-2"></i>
              Launch Into Battle
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
