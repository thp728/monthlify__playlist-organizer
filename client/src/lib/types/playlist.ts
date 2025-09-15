import { PlaylistAction } from "./api";

export interface FrontendPreviewPlaylist {
  id: string;
  name: string;
  imageUrl: string;
  songs: {
    id: string;
    name: string;
    artist: string;
    addedAt: string;
  }[];
  numberOfSongs: number;
}

export interface CreatedPlaylist {
  name: string;
  id: string;
  url: string;
  action: PlaylistAction;
}
