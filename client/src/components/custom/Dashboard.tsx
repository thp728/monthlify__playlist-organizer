import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { Input } from "../ui/input";
import { PlaylistGrid } from "./PlaylistGrid";
import { Playlist } from "@/models/playlist";
import { useRouter } from "next/navigation";

interface DashboardProps {
  userPlaylists: Playlist[];
  userName: string | null;
}

export function Dashboard({ userPlaylists, userName }: DashboardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [urlInput, setUrlInput] = useState<string>("");
  const router = useRouter();

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    // Clear the selected playlist when the user starts typing in the URL input
    if (selectedPlaylistId) {
      setSelectedPlaylistId(null);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
    } else {
      setSelectedPlaylistId(playlistId);
      setUrlInput("");
    }
  };

  const handlePreview = () => {
    let playlistIdentifier: string | null = null;
    let identifierType: "id" | "url" | null = null;

    if (selectedPlaylistId) {
      playlistIdentifier = selectedPlaylistId;
      identifierType = "id";
    } else if (urlInput.trim() !== "") {
      playlistIdentifier = urlInput.trim();
      identifierType = "url";
    } else {
      alert("Please select a playlist or enter a valid URL.");
      return;
    }

    const queryParams = new URLSearchParams({
      identifier: playlistIdentifier,
      type: identifierType,
    }).toString();

    // Redirect to the preview page with the identifier in the URL
    router.push(`/dashboard/preview?${queryParams}`);
  };

  return isProcessing ? (
    <div className="w-full min-h-screen flex justify-center items-center">
      <LoadingSpinner loadingText="Loading..." />
    </div>
  ) : (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="text-center mb-2">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Welcome, {userName}!
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          To get started, please choose a playlist to &apos;Monthlify&apos; from
          the list below, or enter a playlist URL.
        </p>
      </div>

      <div className="flex flex-col flex-grow justify-between items-center">
        {/* Playlist Grid */}
        <PlaylistGrid
          playlists={userPlaylists}
          selectedPlaylistId={selectedPlaylistId}
          onPlaylistClick={handlePlaylistClick}
          isSearchEnabled={true}
        />

        {/* Separator */}
        <div className="flex items-center w-5/6 my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* URL input */}
        <div className="my-4 w-4/6">
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            Paste a Spotify playlist URL
          </h3>
          <Input
            type="url"
            placeholder="e.g., https://open.spotify.com/playlist/..."
            value={urlInput}
            onChange={handleUrlInputChange}
          />
        </div>

        <Button
          onClick={handlePreview}
          disabled={!selectedPlaylistId && urlInput.trim() === ""}
        >
          Preview Monthly Playlists
        </Button>
      </div>
    </div>
  );
}
