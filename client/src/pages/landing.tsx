import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Sword, Trophy, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-primary/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary text-glow">Proteus Nebula</h1>
          </div>
          <Button onClick={handleLogin} className="btn-cosmic">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Proteus Nebula
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleLogin} size="lg" className="btn-cosmic text-lg px-8 py-4">
              <Rocket className="mr-2 h-5 w-5" />
              Launch Into Battle
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Sword className="mr-2 h-5 w-5" />
                  Strategic Combat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Master the three-phase battle system: Command, Deployment, and Battle phases each require different strategies.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Users className="mr-2 h-5 w-5" />
                  Multiplayer & AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Challenge other commanders in ranked matches or hone your skills against intelligent AI opponents.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Trophy className="mr-2 h-5 w-5" />
                  Collect & Build
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Open booster packs, collect rare cards, and build the ultimate deck to climb the galactic rankings.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-primary/30 p-4 text-center text-muted-foreground">
        <p>&copy; 2024 Proteus Nebula. Command the Stars.</p>
      </footer>
    </div>
  );
}
