"use client";

import { Preview } from "@/components/custom/Preview";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import { PlaylistDetail } from "@/models/playlistDetail";
import { Track } from "@/models/track";

interface PreviewTrack {
  id: string;
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
  const [sourceIdentifier, setSourceIdentifier] = useState<string>("");
  const [sourceIdentifierType, setSourceIdentifierType] = useState<string>("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const identifier = searchParams.get("identifier")!;
    const type = searchParams.get("type")!;

    setSourceIdentifier(identifier);
    setSourceIdentifierType(type);

    if (!identifier || !type) {
      router.push("/dashboard");
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/api/preview`, {
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
  }, [searchParams, router, error, apiBaseUrl]);

  useEffect(() => {
    if (previewData) {
      const generatePreviewPlaylists = async () => {
        // Use Promise.all to fetch all images concurrently
        const transformedPlaylistsPromises: Promise<PlaylistDetail>[] =
          previewData.map(async (monthlyPlaylist) => {
            // Extract month and year from the playlist name for the URL
            const nameParts = monthlyPlaylist.name.split(" ");
            const monthCode = nameParts[0].substring(0, 3);
            const year = nameParts[1];

            // Construct the API URL for the image
            const imageUrl = `${apiBaseUrl}/api/images/cover/${monthCode}/${year}`;

            const songs: Track[] = monthlyPlaylist.tracks.map((track) => ({
              id: track.id,
              name: track.name,
              artist: track.artists,
              addedAt: track.added_at,
            }));

            return {
              id: monthlyPlaylist.id.toString(),
              name: monthlyPlaylist.name,
              imageUrl: imageUrl,
              songs: songs,
              numberOfSongs: songs.length,
            };
          });

        const playlistsWithImages = await Promise.all(
          transformedPlaylistsPromises
        );
        setPreviewPlaylists(playlistsWithImages);
      };

      generatePreviewPlaylists();
    }
  }, [previewData, apiBaseUrl]);

  return isLoading ? (
    <div className="w-full min-h-screen flex justify-center items-center">
      <LoadingSpinner loadingText="Generating preview..." />
    </div>
  ) : (
    <Preview
      playlists={previewPlaylists}
      identifier={sourceIdentifier}
      type={sourceIdentifierType}
    />
  );
}
