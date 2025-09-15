from typing import Any, Dict, List, Optional, TypedDict


class SpotifyImage(TypedDict):
    """Represents a Spotify image object."""

    url: str
    height: int
    width: int


class SpotifyOwner(TypedDict):
    """Represents a Spotify playlist owner object."""

    display_name: str
    id: str
    uri: str
    external_urls: Dict[str, str]


class SpotifyTrack(TypedDict):
    """Represents a Spotify track object (simplified)."""

    name: str
    artists: List[Dict[str, str]]
    uri: str


class SpotifyItem(TypedDict):
    """Represents a track item in a playlist."""

    added_at: str
    track: SpotifyTrack


class SpotifyPlaylistsResult(TypedDict):
    """Represents the structure of the playlists API response."""

    items: List[Dict[str, Any]]
    total: int
    next: Optional[str]


class Playlist(TypedDict):
    """
    Represents a user's Spotify playlist.
    Updated to include all keys returned by the API to resolve mypy errors.
    """

    id: str
    name: str
    owner: SpotifyOwner
    tracks: Dict[str, Any]
    images: List[SpotifyImage]
    public: bool
    description: Optional[str]
    uri: str
    external_urls: Dict[str, str]


class UserProfile(TypedDict):
    """Represents a user's Spotify profile (simplified)."""

    id: str
    display_name: str
    images: List[SpotifyImage]


class SimplifiedPlaylist(TypedDict):
    """Represents a simplified playlist object for the frontend."""

    id: str
    name: str
    owner: str
    track_count: int
    image_url: Optional[str]


class MonthlyTrack(TypedDict):
    """Represents a single track in a monthly preview."""

    id: str
    name: str
    artists: str
    added_at: str
    uri: str


class MonthlyPlaylistPreview(TypedDict):
    """Represents a single monthly playlist preview."""

    id: str
    name: str
    tracks: List[MonthlyTrack]
