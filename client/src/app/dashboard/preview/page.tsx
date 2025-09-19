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
import { toast } from "sonner";
import { ErrorState } from "@/lib/types/errorState";
import { ErrorCard } from "@/components/custom/ErrorCard";

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<
    MonthlyPlaylistPreview[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewPlaylists, setPreviewPlaylists] = useState<
    FrontendPreviewPlaylist[]
  >([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sourceIdentifier, setSourceIdentifier] = useState<string>("");
  const [sourceIdentifierType, setSourceIdentifierType] = useState<
    "id" | "url" | null
  >(null);
  const [errorState, setErrorState] = useState<ErrorState>({
    isError: false,
    error: null,
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const identifier = searchParams.get("identifier");
    const type = searchParams.get("type");

    if (!identifier || (type !== "id" && type !== "url")) {
      toast.error("Invalid playlist identifier or type. Please try again.");
      router.push("/dashboard");
      return;
    }

    setSourceIdentifier(identifier);
    setSourceIdentifierType(type);

    const fetchPreviewData = async () => {
      setIsLoading(true);
      setErrorState({ isError: false, error: null });

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
          const data: ErrorResponse = await response.json();
          toast.error("Error generating preview");
          console.error("Error generating preview: ", data.error);
          router.push("/dashboard");
          return;
        }

        const successData: { preview_data: MonthlyPlaylistPreview[] } =
          await response.json();

        if (successData.preview_data.length === 0) {
          toast.info("No new songs found in this playlist to sort by month.");
        } else {
          toast.success("Preview generated successfully!");
        }
        setPreviewData(successData.preview_data);

        setIsLoading(false);
        setErrorState({ isError: false, error: null });
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error(
          "A network error occurred. Please check your connection and try again."
        );
        setErrorState({
          isError: true,
          error:
            "A network error occurred. Please check your connection and try again.",
        });
      }
    };

    fetchPreviewData();
  }, [searchParams, router, apiBaseUrl]);

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

  return isLoading ? (
    <div className="w-full min-h-full flex justify-center items-center">
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
