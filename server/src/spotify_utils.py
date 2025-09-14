import spotipy
import base64
from collections import defaultdict
from urllib.parse import urlparse, parse_qs


def get_all_user_playlists(sp):
    """
    Fetches all public and private playlists of the current user, handling pagination.
    """
    all_playlists = []
    playlists_results = sp.current_user_playlists()
    all_playlists.extend(playlists_results["items"])

    while playlists_results["next"]:
        playlists_results = sp.next(playlists_results)
        all_playlists.extend(playlists_results["items"])

    return all_playlists


def get_liked_songs_as_playlist(sp):
    """
    Fetches the user's liked songs and formats them as a playlist-like dictionary.
    """
    liked_songs_total = sp.current_user_saved_tracks()["total"]

    liked_songs_playlist = {
        "id": "liked-songs",  # Unique ID for the frontend
        "name": "Liked Songs",
        "public": False,
        "description": "All your liked songs",
        "owner": {"display_name": sp.current_user()["display_name"]},
        "tracks": {"total": liked_songs_total},
        "images": [],
    }

    return liked_songs_playlist


def get_all_playlist_tracks(sp, playlist_id):
    """
    Fetches all tracks from a given playlist, handling pagination.
    """
    all_tracks = []

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


def get_or_create_playlist(sp, user_id, playlist_name):
    """
    Checks if a playlist exists and returns it; otherwise, creates a new one.
    """
    playlists = sp.current_user_playlists()
    for playlist in playlists["items"]:
        if playlist["name"] == playlist_name:
            # Clear existing tracks to prevent duplicates
            sp.playlist_replace_items(playlist["id"], [])
            print(f"Found existing playlist '{playlist_name}'. Cleared its contents.")
            return playlist

    # Playlist doesn't exist, create it
    print(f"Creating new playlist: '{playlist_name}'")
    return sp.user_playlist_create(user=user_id, name=playlist_name, public=False)


def add_tracks_to_playlist(sp, playlist_id, track_uris):
    """
    Adds tracks to a playlist in batches of 100 due to API limitations.
    """
    batch_size = 100
    for i in range(0, len(track_uris), batch_size):
        batch = track_uris[i : i + batch_size]
        sp.playlist_add_items(playlist_id, batch)


def create_spotify_client(token_info):
    """
    Creates and returns a Spotipy client object with the user's access token.
    """
    return spotipy.Spotify(auth=token_info["access_token"])


def fetch_playlist_tracks(sp: spotipy.Spotify, playlist_id: str):
    """Fetches all tracks for a given playlist ID using the provided Spotify client."""

    results = sp.playlist_items(
        playlist_id,
        fields="items.added_at,items.track.name,items.track.artists,items.track.uri,next",
        additional_types=("track", "episode"),
    )

    tracks = results["items"]
    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])

    return tracks


def fetch_liked_songs(sp: spotipy.Spotify):
    """Fetches all liked songs for the authenticated user."""
    results = sp.current_user_saved_tracks(limit=50)
    tracks = results["items"]
    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])
    return tracks


def process_tracks_for_preview(tracks):
    """
    Processes a list of tracks and returns a dictionary of monthly previews.
    Each month contains a list of dictionaries with track details.
    """
    monthly_playlists = defaultdict(list)
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
                    "name": track_name,
                    "artists": artist_names,
                    "added_at": added_at,
                    "uri": track_uri,
                }
            )
    return dict(monthly_playlists)


def format_monthly_preview(monthly_data):
    """
    Formats the monthly preview data into a standardized list of monthly playlists,
    with a month and year combination as the unique ID.
    """
    formatted_preview = []
    # Sort months chronologically
    sorted_months = sorted(monthly_data.keys())

    for year_month in sorted_months:
        year, month = year_month.split("-")
        month_name = get_month_name(int(month))

        # Create a list of tracks using their Spotify URIs as IDs
        tracks_with_uri_ids = []
        for track in monthly_data[year_month]:
            tracks_with_uri_ids.append(
                {
                    "id": track["uri"],  # Use the track URI as the unique ID
                    "name": track["name"],
                    "artists": track["artists"],
                    "added_at": track["added_at"],
                }
            )

        formatted_preview.append(
            {
                "id": year_month,  # e.g., "2023-01"
                "name": f"{month_name} {year}",
                "tracks": tracks_with_uri_ids,
            }
        )
    return formatted_preview


def get_month_name(month_number):
    """Helper function to get month name from number."""
    import calendar

    return calendar.month_name[month_number]


def get_monthly_previews_from_id(sp: spotipy.Spotify, playlist_id: str):
    """Processes tracks from a given playlist ID and returns a monthly preview."""
    try:
        tracks = fetch_playlist_tracks(sp, playlist_id)
        monthly_data = process_tracks_for_preview(tracks)
        return format_monthly_preview(monthly_data)
    except Exception as e:
        raise Exception(f"Failed to process playlist: {e}")


def get_monthly_previews_from_url(sp: spotipy.Spotify, playlist_url: str):
    """Extracts ID from a URL and returns a monthly preview."""
    try:
        parsed_url = urlparse(playlist_url)
        if (
            parsed_url.netloc != "open.spotify.com"
            or parsed_url.path.split("/")[1] != "playlist"
        ):
            raise ValueError("Invalid Spotify playlist URL.")

        playlist_id = parsed_url.path.split("/")[-1]
        return get_monthly_previews_from_id(sp, playlist_id)
    except Exception as e:
        raise Exception(f"Invalid URL or failed to fetch playlist: {e}")


def get_monthly_previews_from_liked_songs(sp: spotipy.Spotify):
    """Fetches and processes liked songs, returning a monthly preview."""
    try:
        liked_songs = fetch_liked_songs(sp)
        monthly_data = process_tracks_for_preview(liked_songs)
        return format_monthly_preview(monthly_data)
    except Exception as e:
        raise Exception(f"Failed to process liked songs: {e}")


def find_existing_playlist(sp, user_id, playlist_name):
    """
    Checks if a playlist with a given name already exists for the user.
    """
    playlists = sp.user_playlists(user=user_id)
    for playlist in playlists["items"]:
        if playlist["name"] == playlist_name:
            return playlist
    return None


def create_playlist_with_tracks(
    sp, user_id, source_playlist_name, playlist_name, track_uris
):
    """
    Creates a new Spotify playlist and adds tracks to it,
    or updates an existing playlist with new unique tracks.

    Args:
        sp (spotipy.Spotify): The authenticated spotipy client instance.
        user_id (str): The Spotify ID of the user.
        source_playlist_name (str): The name of the source playlist.
        playlist_name (str): The name for the new or existing playlist.
        track_uris (list): A list of Spotify track URIs to add to the playlist.

    Returns:
        dict: The response from the Spotify API for the new or updated playlist.
    """
    existing_playlist = find_existing_playlist(sp, user_id, playlist_name)

    if existing_playlist:
        print(f"Playlist '{playlist_name}' already exists. Appending new tracks.")
        playlist_id = existing_playlist["id"]

        sp.playlist_change_details(
            playlist_id, description=f"Updated by Monthlify from {source_playlist_name}"
        )

        # Get existing tracks to avoid duplicates
        existing_tracks = sp.playlist_items(playlist_id)["items"]
        existing_track_uris = {track["track"]["uri"] for track in existing_tracks}

        # Filter out tracks that are already in the playlist
        new_track_uris = [uri for uri in track_uris if uri not in existing_track_uris]

        if new_track_uris:
            # Spotify's API has a limit of 100 tracks per request
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

        return existing_playlist

    else:
        print(f"Creating a new playlist named '{playlist_name}'.")
        # Create the playlist
        new_playlist = sp.user_playlist_create(
            user=user_id,
            name=playlist_name,
            public=False,
            description=f"Created by Monthlify from {source_playlist_name}",
        )
        playlist_id = new_playlist["id"]

        # Add tracks to the new playlist
        if track_uris:
            # Spotify's API has a limit of 100 tracks per request
            for i in range(0, len(track_uris), 100):
                chunk = track_uris[i : i + 100]
                sp.user_playlist_add_tracks(
                    user=user_id, playlist_id=playlist_id, tracks=chunk
                )
        return new_playlist


def get_playlist_name_from_identifier(sp, identifier):
    """
    Gets the playlist name from a Spotify playlist ID or URL.

    Args:
        sp (spotipy.Spotify): The authenticated spotipy client instance.
        identifier (str): The Spotify playlist ID or full URL.

    Returns:
        str: The name of the playlist, or None if not found.
    """
    # Check if the identifier is a URL
    if "spotify.com/playlist" in identifier:
        try:
            # Parse the URL to get the playlist ID
            parsed_url = urlparse(identifier)
            playlist_id = parsed_url.path.split("/")[-1]
            # Handle URLs with query parameters
            if not playlist_id:
                playlist_id = (
                    parse_qs(parsed_url.query).get("uri", [None])[0].split(":")[-1]
                )
        except (ValueError, IndexError):
            return None
    else:
        # Assume it's a playlist ID
        playlist_id = identifier

    try:
        playlist = sp.playlist(playlist_id)
        return playlist["name"]
    except Exception:
        return None


def upload_playlist_cover_image(sp, playlist_id, image_stream):
    """
    Uploads a new cover image for a playlist from a byte stream.

    Args:
        sp (spotipy.Spotify): The authenticated spotipy client instance.
        playlist_id (str): The ID of the playlist to update.
        image_stream (io.BytesIO): A byte stream containing the image data.

    Returns:
        bool: True if the upload was successful, False otherwise.
    """
    try:
        # The image data is read from the stream and converted to a base64 encoded string.
        image_data = base64.b64encode(image_stream.getvalue()).decode("utf-8")
        sp.playlist_upload_cover_image(playlist_id, image_data)
        return True
    except Exception as e:
        print(f"Error uploading playlist cover: {e}")
        return False
