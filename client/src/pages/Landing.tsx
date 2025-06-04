import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StarBackground from "@/components/StarBackground";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-glow">
            Proteus Nebula
          </h1>
          <p className="text-xl md:text-2xl text-cosmic-silver mb-8 max-w-3xl mx-auto">
            Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy in this epic space card battle game.
          </p>
        </div>

        <Card className="w-full max-w-md bg-cosmic-800/90 backdrop-blur-md border border-cosmic-gold/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-cosmic-gold">
              <i className="fas fa-rocket mr-3"></i>
              Join the Fleet
            </CardTitle>
            <CardDescription className="text-cosmic-silver">
              Begin your journey as a space commander
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cosmic-gold/50"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Launching...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In to Command
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <Card className="bg-cosmic-800/70 backdrop-blur-md border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sword text-white text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Strategic Combat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cosmic-silver text-center">
                Master the 3-phase battle system: Command, Deployment, and Battle. Every decision shapes the fate of the galaxy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/70 backdrop-blur-md border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-cosmic-900 text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Collect & Build</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cosmic-silver text-center">
                Discover rare cards, open booster packs, and construct the ultimate fleet to dominate your enemies.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/70 backdrop-blur-md border border-cosmic-600 hover:border-cosmic-gold transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Multiplayer Battles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cosmic-silver text-center">
                Challenge AI commanders or face other players in real-time multiplayer battles across the galaxy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
