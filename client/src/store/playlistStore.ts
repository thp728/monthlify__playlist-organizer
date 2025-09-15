import { CreatedPlaylist } from "@/lib/types/playlist";
import { create } from "zustand";

interface PlaylistState {
  newPlaylists: CreatedPlaylist[];
  setNewPlaylists: (playlists: CreatedPlaylist[]) => void;
  clearPlaylists: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  newPlaylists: [],
  setNewPlaylists: (playlists) => set({ newPlaylists: playlists }),
  clearPlaylists: () => set({ newPlaylists: [] }),
}));
