import { create } from "zustand";

// Define the shape of your state
interface PlaylistState {
  newPlaylists: { name: string; url: string }[];
  setNewPlaylists: (playlists: { name: string; url: string }[]) => void;
  clearPlaylists: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  newPlaylists: [],
  setNewPlaylists: (playlists) => set({ newPlaylists: playlists }),
  clearPlaylists: () => set({ newPlaylists: [] }),
}));
