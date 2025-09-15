"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SpotifyAuthResponse } from "@/lib/types/api";
import { Loader2 } from "lucide-react";
import { FaSpotify } from "react-icons/fa";

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "GET",
        credentials: "include",
      });
      const data: SpotifyAuthResponse = await response.json();

      if (data.auth_url) {
        // Redirect the user to the Spotify authorization page
        window.location.href = data.auth_url;
      } else {
        console.error("Failed to get auth URL from backend.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during login process:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading}
      className="mt-8 text-lg font-semibold px-8 py-6"
      onClick={handleLogin}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <span className="mr-2">Logging in...</span>
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 my-3">
          <FaSpotify className="size-6 mr-2" />
          <span>Login with Spotify</span>
        </div>
      )}
    </Button>
  );
}
