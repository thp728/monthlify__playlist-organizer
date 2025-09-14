"use client";

import { Preview } from "@/components/custom/Preview";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import { PlaylistDetail } from "@/models/playlistDetail";
import { Track } from "@/models/track";

interface PreviewTrack {
  name: string;
  artists: string;
  added_at: string;
}

interface PreviewMonthlyPlaylist {
  id: number;
  name: string;
  tracks: PreviewTrack[];
}

interface PreviewResponse {
  preview_data: PreviewMonthlyPlaylist[];
}

interface ErrorResponse {
  error: string;
}

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<
    PreviewMonthlyPlaylist[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPlaylists, setPreviewPlaylists] = useState<PlaylistDetail[]>(
    []
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const identifier = searchParams.get("identifier");
    const type = searchParams.get("type");

    if (!identifier || !type) {
      router.push("/dashboard");
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("http://127.0.0.1:3000/api/preview", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ identifier, type }),
        });

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch playlist preview."
          );
        }

        const successData = await response.json();
        const data: PreviewResponse = successData;
        setPreviewData(data.preview_data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error(err);
        } else {
          setError("An unknown error occurred.");
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [searchParams, router, error]);

  useEffect(() => {
    if (previewData) {
      const transformedPlaylists: PlaylistDetail[] = previewData.map(
        (monthlyPlaylist) => {
          // Transform the tracks to the new `Track` format
          const songs: Track[] = monthlyPlaylist.tracks.map((track, index) => ({
            id: `${monthlyPlaylist.id}-${index}`, // Create a unique ID for each song
            name: track.name,
            artist: track.artists,
            addedAt: track.added_at,
          }));

          // Transform the monthly playlist to the new `PlaylistDetail` format
          return {
            id: monthlyPlaylist.id.toString(),
            name: monthlyPlaylist.name,
            imageUrl: "https://placehold.co/400x400/png",
            songs: songs,
            numberOfSongs: songs.length,
          };
        }
      );
      setPreviewPlaylists(transformedPlaylists);
    }
  }, [previewData]);

  return isLoading ? (
    <div className="w-full min-h-screen flex justify-center items-center">
      <LoadingSpinner loadingText="Generating preview..." />
    </div>
  ) : (
    <Preview playlists={previewPlaylists} />
  );
}
