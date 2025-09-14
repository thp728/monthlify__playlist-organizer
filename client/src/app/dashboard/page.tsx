"use client";

import { Dashboard } from "@/components/custom/Dashboard";
import { Playlist } from "@/models/playlist";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlaylistFromAPI } from "@/models/playlistFromAPI";
import LoadingSpinner from "@/components/custom/LoadingSpinner";

export default function DashboardPage() {
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
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
          throw new Error("Failed to fetch playlists.");
        }

        const playlistsData = await playlistsResponse.json();
        const formattedPlaylists: Playlist[] = playlistsData.playlists.map(
          (p: PlaylistFromAPI) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.image_url || "https://placehold.co/400x400/png",
            numberOfSongs: p.track_count,
          })
        );
        setUserPlaylists(formattedPlaylists);

        // Fetch the user's name from the new endpoint
        const userResponse = await fetch(`${apiBaseUrl}/api/spotify/user`, {
          method: "GET",
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const fullName = userData.name;
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
