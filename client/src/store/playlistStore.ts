import { create } from "zustand";

export enum PlaylistAction {
  Created = "created",
  Updated = "updated",
}

interface PlaylistState {
  newPlaylists: {
    name: string;
    url: string;
    action: PlaylistAction;
  }[];
  setNewPlaylists: (
    playlists: {
      name: string;
      url: string;
      action: PlaylistAction;
    }[]
  ) => void;
  clearPlaylists: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  newPlaylists: [],
  setNewPlaylists: (playlists) => set({ newPlaylists: playlists }),
  clearPlaylists: () => set({ newPlaylists: [] }),
}));
