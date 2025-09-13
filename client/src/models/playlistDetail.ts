import { Track } from "./track";

export interface PlaylistDetail {
  id: string;
  name: string;
  imageUrl: string;
  songs: Track[];
  numberOfSongs: number;
}
