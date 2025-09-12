import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { PlaylistGrid } from "./PlaylistGrid";

interface Playlist {
  id: string;
  name: string;
  imageUrl: string;
}

interface DashboardProps {
  userPlaylists: Playlist[];
}

export function Dashboard({ userPlaylists }: DashboardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const handleMonthlify = () => {
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

    // Now, you can use playlistIdentifier and identifierType to make your API call
    console.log(`Processing ${identifierType}: ${playlistIdentifier}`);

    setIsProcessing(true);
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        router.push("/dashboard/preview");
        setIsProcessing(false);
        console.log("Playlist creation complete!");
      }
    }, 300);
  };

  return isProcessing ? (
    <div className="w-full h-full flex justify-center items-center">
      <LoadingSpinner />
    </div>
  ) : (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full h-full text-center flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Welcome User!
      </h2>
      <h3 className="text-lg font-medium text-gray-700 mb-1">
        Select a playlist to monthlify
      </h3>

      <div className="flex flex-col flex-grow justify-between items-center">
        {/* Playlist Grid */}
        <PlaylistGrid
          playlists={userPlaylists}
          selectedPlaylistId={selectedPlaylistId}
          onPlaylistClick={handlePlaylistClick}
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
          onClick={handleMonthlify}
          disabled={!selectedPlaylistId && urlInput.trim() === ""}
        >
          Preview Monthly Playlists
        </Button>
      </div>
    </div>
  );
}
