"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/custom/LoadingSpinner";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Spotify login error:", error);
      router.push("/");
      return;
    }

    if (code) {
      const exchangeToken = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:3000/api/auth/callback?code=${code}`,
            {
              method: "GET",
              credentials: "include", // IMPORTANT: allow cookies to be set
            }
          );

          if (response.ok) {
            router.push("/dashboard");
          } else {
            const data = await response.json();
            console.error("Error during authentication:", data.error);
            router.push("/");
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          router.push("/");
        }
      };
      exchangeToken();
    }
  }, [searchParams, router]);

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <LoadingSpinner loadingText="Logging you in..." />;
    </div>
  );
}
