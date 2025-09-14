"use client";

import { useState } from "react";
import { PlaylistGrid } from "./PlaylistGrid";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { PlaylistDetail } from "@/models/playlistDetail";
import LoadingSpinner from "./LoadingSpinner";
import { usePlaylistStore } from "@/store/playlistStore";

interface PreviewProps {
  playlists: PlaylistDetail[];
  identifier: string;
  type: string;
}

export function Preview({ playlists, identifier, type }: PreviewProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistDetail | null>(
    null
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const setNewPlaylists = usePlaylistStore((state) => state.setNewPlaylists);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const createPlaylists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/api/create-monthly-playlists`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlists: playlists,
            identifier: identifier,
            type: type,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create playlists.");
      }

      const data = await response.json();
      setNewPlaylists(data.playlists);
      router.push("/dashboard/success");
    } catch (error) {
      console.error("Error creating playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaylistClick = (id: string) => {
    const playlist = playlists.find((pl) => pl.id === id);
    setActivePlaylist(playlist || null);
    setOpenDialog(true);
  };

  const changeMasterPlaylist = () => {
    router.push("/dashboard");
  };

  return isLoading ? (
    <div className="w-full min-h-screen flex justify-center items-center">
      <LoadingSpinner loadingText="Creating playlists..." />
    </div>
  ) : (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* The info text and heading here */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Review & Create Your Monthly Playlists
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Based on your selected playlist, we&apos;ve organized your songs into
          the following monthly playlists. Take a moment to review them.
          Clicking
          <strong> &apos;Create Playlists&apos;</strong> will add them to your
          Spotify account.
        </p>
      </div>

      <div className="flex flex-col items-center">
        <PlaylistGrid
          playlists={playlists}
          selectedPlaylistId={null}
          onPlaylistClick={onPlaylistClick}
          isSearchEnabled={false}
        />

        <div className="mt-6 flex space-x-4">
          <Button variant="outline" onClick={changeMasterPlaylist}>
            Select a Different Master Playlist
          </Button>
          <Button onClick={createPlaylists}>Create Playlists</Button>
        </div>
      </div>

      {/* Dialog for playlist details */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activePlaylist?.name}</DialogTitle>
          </DialogHeader>
          {activePlaylist && (
            <div className="mt-1 max-h-[400px] overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {activePlaylist.songs.map((song) => (
                  <li key={song.id} className="py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {song.name}
                    </p>
                    <p className="text-xs text-gray-500">{song.artist}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
