"use client";

import { useState } from "react";
import { HeroSection } from "@/components/custom/HeroSection";
import LoadingSpinner from "@/components/custom/LoadingSpinner";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:3000/api/auth/login", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

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
    <div className="h-full flex flex-col justify-center items-center">
      {isLoading ? (
        <LoadingSpinner loadingText="Logging you in..." />
      ) : (
        <HeroSection onLogin={handleLogin} />
      )}
    </div>
  );
}
