import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StarBackground from "@/components/ui/star-background";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cosmic-gold to-cosmic-silver mb-6 animate-glow">
            Proteus Nebula
          </h1>
          <p className="text-xl md:text-2xl text-cosmic-silver mb-8 max-w-2xl">
            Command your fleet across the cosmic battlefields. Collect powerful cards, build strategic decks, and dominate the galaxy.
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark text-cosmic-900 font-bold px-8 py-4 text-lg hover:scale-105 transition-transform duration-200"
          >
            <i className="fas fa-rocket mr-2"></i>
            Launch Into Battle
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <Card className="bg-cosmic-800/50 border-cosmic-600 hover:border-cosmic-gold transition-colors duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sword text-white text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Strategic Combat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-cosmic-silver text-center">
                Master the three-phase battle system: Command, Deployment, and Battle. Every decision matters in your quest for galactic supremacy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/50 border-cosmic-600 hover:border-cosmic-gold transition-colors duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-white text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Deck Building</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-cosmic-silver text-center">
                Collect hundreds of unique cards and build powerful decks. Combine units, commands, and shipyards to create your perfect strategy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-cosmic-800/50 border-cosmic-600 hover:border-cosmic-gold transition-colors duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cosmic-gold to-cosmic-gold-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-cosmic-900 text-2xl"></i>
              </div>
              <CardTitle className="text-cosmic-gold">Competitive Play</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-cosmic-silver text-center">
                Battle against AI opponents or challenge other commanders in ranked matches. Climb the leaderboards and earn your place among the elite.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
