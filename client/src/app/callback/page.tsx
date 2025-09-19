"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import { ErrorResponse } from "@/lib/types/api";

import { toast } from "sonner";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Spotify login error:", error);
      toast.error("Spotify Login Error. Please try again.");
      router.push("/");
      return;
    }

    if (code) {
      const exchangeToken = async () => {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/auth/callback?code=${code}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (response.ok) {
            toast.success("Successfully logged in!");
            router.push("/dashboard");
          } else {
            const data: ErrorResponse = await response.json();
            console.error("Backend authentication error:", data.error);
            toast.error("Authentication Failed");
            router.push("/");
          }
        } catch (error) {
          console.error("Network error during authentication:", error);
          toast.error(
            "Could not connect to the server. Please check your connection and try again."
          );
          router.push("/");
        }
      };
      exchangeToken();
    }
  }, [searchParams, router, apiBaseUrl]);

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <LoadingSpinner loadingText="Logging you in..." />
    </div>
  );
}
