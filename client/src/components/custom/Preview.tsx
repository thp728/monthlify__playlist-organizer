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

interface Song {
  id: string;
  name: string;
  artist: string;
}

interface PlaylistDetail {
  id: string;
  name: string;
  imageUrl: string;
  songs: Song[];
}

interface PreviewProps {
  userPlaylists: PlaylistDetail[];
}

export function Preview({ userPlaylists }: PreviewProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistDetail | null>(
    null
  );
  const router = useRouter();

  const handlePlaylistClick = (playlistId: string) => {};

  const createPlaylists = () => {};

  const changeMasterPlaylist = () => {
    router.push("/dashboard");
  };

  const onPlaylistClick = (id: string) => {
    const playlist = userPlaylists.find((pl) => pl.id === id) || null;
    setActivePlaylist(playlist);
    setOpenDialog(true);
    handlePlaylistClick(id);
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg w-full h-full text-center flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Preview Your Monthly Playlists
      </h2>
      <h3 className="text-lg font-medium text-gray-700 mb-1">
        Based on your selected master playlist, your songs will be organized
        into the following monthly playlists.
      </h3>
      <p>
        Please review the playlists and their contents. When you are ready,
        click &apos;Create Playlists&apos; to add them to your Spotify account.
      </p>

      <div className="flex flex-col flex-grow justify-between items-center">
        <PlaylistGrid
          playlists={userPlaylists}
          selectedPlaylistId={selectedPlaylistId}
          onPlaylistClick={onPlaylistClick}
        />

        <div className="flex space-x-2 mt-6">
          <Button variant="ghost" onClick={changeMasterPlaylist}>
            Select a Different Master Playlist
          </Button>
          <Button onClick={createPlaylists}>Create Playlists</Button>
        </div>
      </div>

      {/* Dialog for playlist details */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{activePlaylist?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            {activePlaylist && (
              <>
                <ul className="text-left w-full max-h-60 overflow-y-auto">
                  {activePlaylist.songs?.map((song) => (
                    <li key={song.id} className="py-1 border-b text-gray-700">
                      {song.name} —{" "}
                      <span className="text-gray-500">{song.artist}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
