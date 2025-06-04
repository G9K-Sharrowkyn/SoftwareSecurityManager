import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarBackground from "@/components/StarBackground";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-gradient-to-r from-background/80 via-card/80 to-background/80 backdrop-blur-lg border-b border-primary/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-primary animate-glow">
                <i className="fas fa-rocket mr-2"></i>
                Proteus Nebula
              </div>
              <div className="hidden md:block text-sm text-muted-foreground">
                Battle Card Game
              </div>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="bg-primary hover:bg-accent text-primary-foreground font-semibold px-6 py-2 animate-pulse-gold"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-glow">
            Proteus Nebula
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy in this epic space card battle game.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-sword text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Strategic Combat</h3>
                <p className="text-muted-foreground">
                  Master the three-phase battle system with Command, Deployment, and Battle phases
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-layer-group text-primary-foreground text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Deck Building</h3>
                <p className="text-muted-foreground">
                  Collect and customize powerful decks with unique units, commands, and shipyards
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/30 hover:border-primary transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Multiplayer</h3>
                <p className="text-muted-foreground">
                  Battle against AI opponents or challenge other commanders in real-time
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold px-8 py-4 text-lg animate-pulse-gold"
            >
              <i className="fas fa-rocket mr-2"></i>
              Enter the Nebula
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Join thousands of commanders in the ultimate space card battle experience
            </p>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-12">
            Master the Galaxy
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Unique Cards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-muted-foreground">Strategic Combinations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">3</div>
              <div className="text-muted-foreground">Game Phases</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Online Battles</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
