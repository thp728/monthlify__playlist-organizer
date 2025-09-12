"use client";

import { useState } from "react";
import { HeroSection } from "@/components/custom/HeroSection";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setIsLoading(true);
    // In a real app, this would redirect to the Spotify auth URL.
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="h-screen flex justify-center items-center bg-gray-50 p-10">
      {!isLoggedIn ? (
        isLoading ? (
          <LoadingSpinner />
        ) : (
          <HeroSection onLogin={handleLogin} />
        )
      ) : null}
    </main>
  );
}
