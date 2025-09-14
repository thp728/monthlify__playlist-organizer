import spotipy
from collections import defaultdict
from urllib.parse import urlparse


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
        fields="items.added_at,items.track.name,items.track.artists,next",
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

            monthly_playlists[year_month].append(
                {"name": track_name, "artists": artist_names, "added_at": added_at}
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

        # Create a list of tracks with unique IDs
        tracks_with_unique_ids = []
        for i, track in enumerate(monthly_data[year_month]):
            tracks_with_unique_ids.append(
                {
                    "id": f"{year_month}-{i}",  # Unique ID for each track
                    "name": track["name"],
                    "artists": track["artists"],
                    "added_at": track["added_at"],
                }
            )

        formatted_preview.append(
            {
                "id": year_month,  # e.g., "2023-01"
                "name": f"{month_name} {year}",
                "tracks": tracks_with_unique_ids,
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
