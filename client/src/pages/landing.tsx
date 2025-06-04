import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Star, Trophy, Users, Zap, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="mb-8">
          <Rocket className="w-16 h-16 text-primary mx-auto mb-4 cosmic-float" />
          <h1 className="cosmic-title mb-6">
            Proteus Nebula
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Command your fleet across the cosmic battlefields. Collect powerful cards, 
            build strategic decks, and dominate the galaxy in this epic space card battle game.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button 
            onClick={handleLogin}
            size="lg"
            className="cosmic-button text-lg px-8 py-4"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Launch Into Battle
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="cosmic-button-secondary text-lg px-8 py-4"
          >
            <Star className="w-5 h-5 mr-2" />
            Watch Trailer
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="cosmic-card">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-primary">Strategic Combat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Master the 3-phase battle system: Command, Deployment, and Battle. 
                Every decision shapes the cosmic war.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-primary">Collect & Build</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Gather hundreds of unique cards featuring starships, space stations, 
                and alien technologies. Build the ultimate deck.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-primary">Multiplayer Battles</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Challenge commanders from across the galaxy in ranked battles, 
                or test your skills against advanced AI opponents.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 py-16 px-4 text-center bg-gradient-to-t from-muted/50 to-transparent">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Ready to Command the Stars?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of space commanders in the ultimate card battle experience. 
          Your fleet awaits your command.
        </p>
        <Button 
          onClick={handleLogin}
          size="lg"
          className="cosmic-button text-lg px-12 py-4"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Begin Your Journey
        </Button>
      </div>
    </div>
  );
}
