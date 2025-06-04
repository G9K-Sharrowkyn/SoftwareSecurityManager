import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Sword, Trophy, Users, Zap, Star } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-card/90 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Rocket className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary">Proteus Nebula</span>
                <Badge variant="secondary" className="ml-2">
                  Beta
                </Badge>
              </div>
              
              <Button onClick={handleLogin} className="cosmic-button">
                <Star className="w-4 h-4 mr-2" />
                Enter the Galaxy
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary mb-6 animate-pulse-glow">
              Proteus Nebula
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Command your fleet across the cosmic battlefields. Collect powerful cards, 
              build strategic decks, and dominate the galaxy in this MTG-inspired space card game.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button onClick={handleLogin} size="lg" className="cosmic-button text-lg px-8 py-4">
                <Rocket className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Users className="w-5 h-5 mr-2" />
                Watch Gameplay
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card className="bg-card/60 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
                <CardHeader>
                  <Sword className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Strategic Combat</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Master the 3-phase battle system: Command, Deployment, and Battle. 
                    Every decision shapes the outcome of cosmic warfare.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
                <CardHeader>
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Collect & Build</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Open booster packs, collect hundreds of unique cards, and build 
                    powerful decks. Each card tells a story of galactic conquest.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
                <CardHeader>
                  <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Multiplayer Battles</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Challenge AI opponents or face other commanders in real-time 
                    multiplayer battles. Climb the ranks and prove your tactical superiority.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-card/50 backdrop-blur-sm border-t border-border py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-muted-foreground">
              © 2024 Proteus Nebula. Embark on your cosmic journey today.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
