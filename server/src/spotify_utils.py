import spotipy
import math


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
