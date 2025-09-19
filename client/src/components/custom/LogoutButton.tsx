"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ErrorResponse } from "@/lib/types/api";

export function LogoutButton() {
  const router = useRouter();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleLogout = async () => {
    try {
      const logoutToastId = toast.loading("Logging you out...", {
        description: "This will end your session.",
      });

      // Make a request to the backend logout endpoint
      const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.dismiss(logoutToastId);
        toast.success("Successfully logged out.");
        router.push("/");
      } else {
        const data: ErrorResponse = await response.json();

        toast.dismiss(logoutToastId);
        console.error("Error occurred during logout: ", data.error);
        toast.error("Error occurred during logout.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("A network error occurred. Please try again.");
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}
