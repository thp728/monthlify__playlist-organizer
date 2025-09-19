"use client";

import { Dashboard } from "@/components/custom/Dashboard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import {
  ErrorResponse,
  SimplifiedPlaylist,
  UserProfile,
} from "@/lib/types/api";
import { toast } from "sonner";
import { ErrorCard } from "@/components/custom/ErrorCard";
import { ErrorState } from "@/lib/types/errorState";

export default function DashboardPage() {
  const [userPlaylists, setUserPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<ErrorState>({
    isError: false,
    error: null,
  });
  const router = useRouter();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setErrorState({ isError: false, error: null });

        // Fetch user playlists
        const playlistsResponse = await fetch(
          `${apiBaseUrl}/api/spotify/playlists`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!playlistsResponse.ok) {
          if (playlistsResponse.status === 401) {
            toast.error("Your session has expired. Please log in again.");
            router.push("/");
            return;
          }
          const data: ErrorResponse = await playlistsResponse.json();
          // Display a generic error for other non-401 API errors
          toast.error(`Error loading playlists`);
          console.error("Error loading playlists: ", data.error);
          setErrorState({
            isError: true,
            error: data.error,
          });
          setIsLoading(false);
          return;
        }

        const playlistsData: { playlists: SimplifiedPlaylist[] } =
          await playlistsResponse.json();
        const formattedPlaylists: SimplifiedPlaylist[] =
          playlistsData.playlists.map((p) => ({
            id: p.id,
            name: p.name,
            owner: p.owner,
            track_count: p.track_count,
            image_url: p.image_url,
          }));
        setUserPlaylists(formattedPlaylists);

        // Fetch the user's name from the new endpoint
        const userResponse = await fetch(`${apiBaseUrl}/api/spotify/user`, {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData: UserProfile = await userResponse.json();
          const fullName = userData.display_name;
          const firstName = fullName.split(" ")[0];
          setUserName(firstName);
        } else {
          toast.warning(
            "Couldn't retrieve your display name. It may be a temporary issue."
          );
        }

        toast.success("Playlists loaded successfully!");

        setIsLoading(false);
        setErrorState({ isError: false, error: null });
      } catch (error) {
        console.error("Network error occurred:", error);
        toast.error(
          "A network error occurred. Please check your connection and try again."
        );
        setErrorState({
          isError: true,
          error:
            "A network error occurred. Please check your connection and try again.",
        });
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router, apiBaseUrl]);

  if (isLoading) {
    return (
      <div className="min-h-full flex justify-center items-center">
        <LoadingSpinner loadingText="Loading Playlists..." />
      </div>
    );
  }

  if (errorState.isError) {
    return (
      <div className="min-h-full w-2/6 flex justify-center items-center">
        <ErrorCard
          errorTitle="Something Went Wrong"
          errorMessage={errorState.error || "An unknown error occurred."}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return <Dashboard userPlaylists={userPlaylists} userName={userName} />;
}
