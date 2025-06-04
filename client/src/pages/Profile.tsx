import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
    }
  }, [user]);

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const saveProfile = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("failed");
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="max-w-sm space-y-4">
        <div>
          <label className="block mb-1 text-sm">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <Button onClick={saveProfile}>Save</Button>
      </div>
    </div>
  );
}
