"use client";

import { Preview } from "@/components/custom/Preview";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/custom/LoadingSpinner";
import {
  ErrorResponse,
  MonthlyPlaylistPreview,
  MonthlyTrack,
} from "@/lib/types/api";
import { FrontendPreviewPlaylist } from "@/lib/types/playlist";

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<
    MonthlyPlaylistPreview[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPlaylists, setPreviewPlaylists] = useState<
    FrontendPreviewPlaylist[]
  >([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sourceIdentifier, setSourceIdentifier] = useState<string>("");
  const [sourceIdentifierType, setSourceIdentifierType] = useState<
    "id" | "url" | null
  >(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const identifier = searchParams.get("identifier");
    const type = searchParams.get("type");

    if (!identifier || (type !== "id" && type !== "url")) {
      router.push("/dashboard");
      return;
    }

    setSourceIdentifier(identifier);
    setSourceIdentifierType(type);

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

        const successData: { preview_data: MonthlyPlaylistPreview[] } =
          await response.json();
        setPreviewData(successData.preview_data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error(error);
        } else {
          setError("An unknown error occurred.");
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [searchParams, router, apiBaseUrl, error]);

  useEffect(() => {
    if (previewData) {
      const generatePreviewPlaylists = () => {
        const transformedPlaylists: FrontendPreviewPlaylist[] = previewData.map(
          (monthlyPlaylist) => {
            // Extract month and year from the playlist name for the URL
            const nameParts = monthlyPlaylist.name.split(" ");
            const monthCode = nameParts[0].substring(0, 3);
            const year = nameParts[1];

            // Construct the API URL for the image
            const imageUrl = `${apiBaseUrl}/api/images/cover/${monthCode}/${year}`;

            const songs = monthlyPlaylist.tracks.map((track: MonthlyTrack) => ({
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
          }
        );
        setPreviewPlaylists(transformedPlaylists);
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
