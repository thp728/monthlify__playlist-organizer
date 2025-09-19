"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ErrorResponse, SpotifyAuthResponse } from "@/lib/types/api";
import { Loader2 } from "lucide-react";
import { FaSpotify } from "react-icons/fa";
import { toast } from "sonner";

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

      if (!response.ok) {
        const data: ErrorResponse = await response.json();
        toast.error(`Login Error: Failed to get auth URL. Please try again`);
        console.error("Login Error: ", data.error);
        setIsLoading(false);
        return;
      }

      const data: SpotifyAuthResponse = await response.json();

      if (data.auth_url) {
        // Redirect the user to the Spotify authorization page
        window.location.href = data.auth_url;
      } else {
        toast.error(
          "An unexpected error occurred. No authorization URL was provided."
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during login process:", error);
      toast.error(
        "A network error occurred. Please check your connection and try again."
      );
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
