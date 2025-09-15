import spotipy
import base64
from collections import defaultdict
from urllib.parse import urlparse, parse_qs
from typing import List, Dict, Any, Optional
from io import BytesIO
from .models.spotify_types import (
    SpotifyPlaylistsResult,
    Playlist,
    SimplifiedPlaylist,
    SpotifyItem,
    MonthlyPlaylistPreview,
    MonthlyTrack,
    UserProfile,
)


def get_all_user_playlists(sp: spotipy.Spotify) -> List[Dict[str, Any]]:
    """
    Fetches all public and private playlists of the current user, handling pagination.
    """
    all_playlists: List[Dict[str, Any]] = []
    playlists_results: SpotifyPlaylistsResult = sp.current_user_playlists()
    all_playlists.extend(playlists_results["items"])

    while playlists_results["next"]:
        playlists_results = sp.next(playlists_results)
        all_playlists.extend(playlists_results["items"])

    return all_playlists


def get_liked_songs_as_playlist(sp: spotipy.Spotify) -> Dict[str, Any]:
    """
    Fetches the user's liked songs and formats them as a playlist-like dictionary.
    """
    liked_songs_total: int = sp.current_user_saved_tracks()["total"]

    liked_songs_playlist: Dict[str, Any] = {
        "id": "liked-songs",
        "name": "Liked Songs",
        "public": False,
        "description": "All your liked songs",
        "owner": {
            "display_name": sp.current_user()["display_name"],
            "id": "me",
            "uri": "",
            "external_urls": {},
        },
        "tracks": {"total": liked_songs_total},
        "images": [],
    }

    return liked_songs_playlist


def get_all_playlist_tracks(
    sp: spotipy.Spotify, playlist_id: str
) -> List[Dict[str, Any]]:
    """
    Fetches all tracks from a given playlist, handling pagination.
    """
    all_tracks: List[Dict[str, Any]] = []

    if playlist_id == "liked-songs":
        results = sp.current_user_saved_tracks(limit=50)
    else:
        results = sp.playlist_items(
            playlist_id, fields="items,total,next", additional_types=("track",)
        )

    all_tracks.extend(results["items"])

    while results["next"]:
        results = sp.next(results)
        all_tracks.extend(results["items"])

    return all_tracks


def get_or_create_playlist(
    sp: spotipy.Spotify, user_id: str, playlist_name: str
) -> Dict[str, Any]:
    """
    Checks if a playlist exists and returns it; otherwise, creates a new one.
    """
    playlists: SpotifyPlaylistsResult = sp.current_user_playlists()
    for playlist in playlists["items"]:
        if playlist["name"] == playlist_name:
            # Clear existing tracks to prevent duplicates
            sp.playlist_replace_items(playlist["id"], [])
            print(f"Found existing playlist '{playlist_name}'. Cleared its contents.")
            return playlist

    # Playlist doesn't exist, create it
    print(f"Creating new playlist: '{playlist_name}'")
    return sp.user_playlist_create(user=user_id, name=playlist_name, public=False)


def add_tracks_to_playlist(
    sp: spotipy.Spotify, playlist_id: str, track_uris: List[str]
) -> None:
    """
    Adds tracks to a playlist in batches of 100 due to API limitations.
    """
    batch_size = 100
    for i in range(0, len(track_uris), batch_size):
        batch = track_uris[i : i + batch_size]
        sp.playlist_add_items(playlist_id, batch)


def create_spotify_client(token_info: Dict[str, str]) -> spotipy.Spotify:
    """
    Creates and returns a Spotipy client object with the user's access token.
    """
    return spotipy.Spotify(auth=token_info["access_token"])


def fetch_playlist_tracks(sp: spotipy.Spotify, playlist_id: str) -> List[SpotifyItem]:
    """Fetches all tracks for a given playlist ID using the provided Spotify client."""
    results: Dict[str, Any] = sp.playlist_items(
        playlist_id,
        fields="items.added_at,items.track.name,items.track.artists,items.track.uri,next",
        additional_types=("track", "episode"),
    )

    tracks: List[SpotifyItem] = results["items"]
    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])

    return tracks


def fetch_liked_songs(sp: spotipy.Spotify) -> List[SpotifyItem]:
    """Fetches all liked songs for the authenticated user."""
    results: Dict[str, Any] = sp.current_user_saved_tracks(limit=50)
    tracks: List[SpotifyItem] = results["items"]
    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])
    return tracks


def process_tracks_for_preview(
    tracks: List[SpotifyItem],
) -> Dict[str, List[MonthlyTrack]]:
    """
    Processes a list of tracks and returns a dictionary of monthly previews.
    Each month contains a list of dictionaries with track details.
    """
    monthly_playlists: Dict[str, List[MonthlyTrack]] = defaultdict(list)
    for item in tracks:
        added_at = item.get("added_at")
        track = item.get("track")

        if added_at and track:
            added_date = added_at.split("T")[0]
            year_month = added_date[:7]  # e.g., "2023-01"

            track_name = track["name"]
            artist_names = ", ".join([artist["name"] for artist in track["artists"]])
            track_uri = track["uri"]

            monthly_playlists[year_month].append(
                {
                    "id": track_uri,
                    "name": track_name,
                    "artists": artist_names,
                    "added_at": added_at,
                    "uri": track_uri,
                }
            )
    return dict(monthly_playlists)


def format_monthly_preview(
    monthly_data: Dict[str, List[MonthlyTrack]],
) -> List[MonthlyPlaylistPreview]:
    """
    Formats the monthly preview data into a standardized list of monthly playlists,
    with a month and year combination as the unique ID.
    """
    formatted_preview: List[MonthlyPlaylistPreview] = []
    # Sort months chronologically
    sorted_months = sorted(monthly_data.keys())

    for year_month in sorted_months:
        year, month = year_month.split("-")
        month_name = get_month_name(int(month))

        # This part looks fine based on the updated `process_tracks_for_preview`
        tracks_with_uri_ids: List[MonthlyTrack] = monthly_data[year_month]

        formatted_preview.append(
            {
                "id": year_month,  # e.g., "2023-01"
                "name": f"{month_name} {year}",
                "tracks": tracks_with_uri_ids,
            }
        )
    return formatted_preview


def get_month_name(month_number: int) -> str:
    """Helper function to get month name from number."""
    import calendar

    return calendar.month_name[month_number]


def get_monthly_previews_from_id(
    sp: spotipy.Spotify, playlist_id: str
) -> List[MonthlyPlaylistPreview]:
    """Processes tracks from a given playlist ID and returns a monthly preview."""
    try:
        tracks = fetch_playlist_tracks(sp, playlist_id)
        monthly_data = process_tracks_for_preview(tracks)
        return format_monthly_preview(monthly_data)
    except Exception as e:
        raise Exception(f"Failed to process playlist: {e}")


def get_monthly_previews_from_url(
    sp: spotipy.Spotify, playlist_url: str
) -> List[MonthlyPlaylistPreview]:
    """Extracts ID from a URL and returns a monthly preview."""
    try:
        parsed_url = urlparse(playlist_url)
        if "spotify.com/playlist/" not in playlist_url:
            raise ValueError("Invalid Spotify playlist URL.")

        playlist_id = parsed_url.path.split("/")[-1]
        return get_monthly_previews_from_id(sp, playlist_id)
    except Exception as e:
        raise Exception(f"Invalid URL or failed to fetch playlist: {e}")


def get_monthly_previews_from_liked_songs(
    sp: spotipy.Spotify,
) -> List[MonthlyPlaylistPreview]:
    """Fetches and processes liked songs, returning a monthly preview."""
    try:
        liked_songs = fetch_liked_songs(sp)
        monthly_data = process_tracks_for_preview(liked_songs)
        return format_monthly_preview(monthly_data)
    except Exception as e:
        raise Exception(f"Failed to process liked songs: {e}")


def find_existing_playlist(
    sp: spotipy.Spotify, user_id: str, playlist_name: str
) -> Optional[Playlist]:
    """
    Checks if a playlist with a given name already exists for the user.
    """
    playlists: Dict[str, Any] = sp.user_playlists(user=user_id)
    for playlist in playlists["items"]:
        if playlist["name"] == playlist_name:
            return playlist
    return None


def create_playlist_with_tracks(
    sp: spotipy.Spotify,
    user_id: str,
    source_playlist_name: str,
    playlist_name: str,
    track_uris: List[str],
) -> Dict[str, Any]:
    """
    Creates a new Spotify playlist and adds tracks to it,
    or updates an existing playlist with new unique tracks.
    """
    existing_playlist = find_existing_playlist(sp, user_id, playlist_name)

    if existing_playlist:
        print(f"Playlist '{playlist_name}' already exists. Appending new tracks.")
        playlist_id = existing_playlist["id"]

        sp.playlist_change_details(
            playlist_id, description=f"Updated by Monthlify from {source_playlist_name}"
        )

        existing_tracks = sp.playlist_items(playlist_id)["items"]
        existing_track_uris = {track["track"]["uri"] for track in existing_tracks}

        new_track_uris = [uri for uri in track_uris if uri not in existing_track_uris]

        if new_track_uris:
            for i in range(0, len(new_track_uris), 100):
                chunk = new_track_uris[i : i + 100]
                sp.user_playlist_add_tracks(
                    user=user_id, playlist_id=playlist_id, tracks=chunk
                )
            print(f"Added {len(new_track_uris)} new tracks to '{playlist_name}'.")
        else:
            print(
                f"All tracks already exist in '{playlist_name}'. No new tracks added."
            )

        return {"playlist": existing_playlist, "action_taken": "updated"}

    else:
        print(f"Creating a new playlist named '{playlist_name}'.")
        new_playlist = sp.user_playlist_create(
            user=user_id,
            name=playlist_name,
            public=False,
            description=f"Created by Monthlify from {source_playlist_name}",
        )
        playlist_id = new_playlist["id"]

        if track_uris:
            for i in range(0, len(track_uris), 100):
                chunk = track_uris[i : i + 100]
                sp.user_playlist_add_tracks(
                    user=user_id, playlist_id=playlist_id, tracks=chunk
                )
        return {"playlist": new_playlist, "action_taken": "created"}


def get_playlist_name_from_identifier(
    sp: spotipy.Spotify, identifier: str
) -> Optional[str]:
    """
    Gets the playlist name from a Spotify playlist ID or URL.
    """
    if "spotify.com/playlist/" in identifier:
        try:
            parsed_url = urlparse(identifier)
            playlist_id = parsed_url.path.split("/")[-1]
            if not playlist_id:
                # MyPy fix: Added a check for the `uri` from `parse_qs` to be a list
                uri_list = parse_qs(parsed_url.query).get("uri", [None])
                if uri_list and uri_list[0]:
                    playlist_id = uri_list[0].split(":")[-1]
                else:
                    return None
        except (ValueError, IndexError):
            return None
    else:
        playlist_id = identifier

    try:
        playlist = sp.playlist(playlist_id)
        return playlist["name"]
    except Exception:
        return None


def upload_playlist_cover_image(
    sp: spotipy.Spotify, playlist_id: str, image_stream: BytesIO
) -> bool:
    """
    Uploads a new cover image for a playlist from a byte stream.
    """
    try:
        image_data = base64.b64encode(image_stream.getvalue()).decode("utf-8")
        sp.playlist_upload_cover_image(playlist_id, image_data)
        return True
    except Exception as e:
        print(f"Error uploading playlist cover: {e}")
        return False
