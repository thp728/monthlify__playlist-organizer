import { PlaylistCard } from "./PlaylistCard";

interface Playlist {
  id: string;
  name: string;
  imageUrl: string;
}

interface PlaylistGridProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onPlaylistClick: (playlistId: string) => void;
}

export function PlaylistGrid({
  playlists,
  selectedPlaylistId,
  onPlaylistClick,
}: PlaylistGridProps) {
  return (
    <div className="grid grid-cols-6 gap-4 overflow-y-auto p-5">
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlistName={playlist.name}
          albumCoverUrl={playlist.imageUrl}
          onClick={() => onPlaylistClick(playlist.id)}
          isSelected={selectedPlaylistId === playlist.id}
        />
      ))}
    </div>
  );
}
