"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-2 p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">Logging you in...</p>
      </div>
    </div>
  );
}
