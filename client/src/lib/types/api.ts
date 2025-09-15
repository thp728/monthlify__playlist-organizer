/**
 * Represents the response from the /api/auth/login endpoint.
 */
export interface SpotifyAuthResponse {
  auth_url: string;
}

/**
 * Represents a simplified playlist object returned by the /api/spotify/playlists endpoint.
 */
export interface SimplifiedPlaylist {
  id: string;
  name: string;
  owner: string;
  track_count: number;
  image_url: string | null;
}

/**
 * Represents a monthly track object returned as part of the /api/preview endpoint.
 */
export interface MonthlyTrack {
  id: string; // The track's URI
  name: string;
  artists: string;
  added_at: string; // ISO 8601 format date-time string
  uri: string;
}

/**
 * Represents a single monthly playlist preview returned by the /api/preview endpoint.
 */
export interface MonthlyPlaylistPreview {
  id: string; // e.g., "2023-01"
  name: string; // e.g., "January 2023"
  tracks: MonthlyTrack[];
}

/**
 * Represents the user profile data returned by the /api/spotify/user endpoint.
 */
export interface UserProfile {
  id: string;
  display_name: string;
  images: { url: string; height: number; width: number }[];
}

/**
 * Represents the response from the /api/create-monthly-playlists endpoint.
 */
export interface CreatePlaylistsResponse {
  message: string;
  playlists: {
    name: string;
    id: string;
    url: string;
    action: PlaylistAction;
  }[];
}

/**
 * Represents a generic error response from the API.
 */
export interface ErrorResponse {
  error: string;
}

export enum PlaylistAction {
  Created = "created",
  Updated = "updated",
}
