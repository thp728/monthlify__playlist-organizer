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

export default function DashboardPage() {
  const [userPlaylists, setUserPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    async function fetchData() {
      try {
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
            router.push("/");
          }
          const data: ErrorResponse = await playlistsResponse.json();
          throw new Error(data.error);
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
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router, apiBaseUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner loadingText="Loading Playlists..." />
      </div>
    );
  }

  return <Dashboard userPlaylists={userPlaylists} userName={userName} />;
}
