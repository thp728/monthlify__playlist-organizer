from flask import Flask, jsonify, request, make_response
import os
from flask_cors import CORS
from . import spotify_utils, auth

import spotipy

app = Flask(__name__)
CORS(app, supports_credentials=True)


# Load configuration from a .env file or environment variables
# For now, we will add these directly.
# In a real-world scenario, you would use a library like python-dotenv
# to load these from a file.
app.config["SPOTIFY_CLIENT_ID"] = os.getenv("SPOTIFY_CLIENT_ID")
app.config["SPOTIFY_CLIENT_SECRET"] = os.getenv("SPOTIFY_CLIENT_SECRET")
app.config["SPOTIFY_REDIRECT_URI"] = os.getenv("SPOTIFY_REDIRECT_URI")


@app.route("/")
def home():
    """
    A simple root endpoint to check if the server is running.
    """
    return jsonify({"message": "Welcome to the Monthlify API!"})


@app.route("/api/auth/login", methods=["GET"])
def spotify_login():
    """
    Redirects the user to the Spotify authorization page.
    """
    auth_url = auth.get_spotify_auth_url(
        client_id=app.config["SPOTIFY_CLIENT_ID"],
        redirect_uri=app.config["SPOTIFY_REDIRECT_URI"],
    )
    return jsonify({"auth_url": auth_url})


@app.route("/api/auth/callback", methods=["GET"])
def spotify_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No authorization code provided."}), 400

    try:
        token_info = auth.get_spotify_token(
            client_id=app.config["SPOTIFY_CLIENT_ID"],
            client_secret=app.config["SPOTIFY_CLIENT_SECRET"],
            redirect_uri=app.config["SPOTIFY_REDIRECT_URI"],
            code=code,
        )

        resp = make_response(jsonify({"message": "Authentication successful."}))

        # Access token (short-lived)
        resp.set_cookie(
            "spotify_access_token",
            token_info["access_token"],
            httponly=True,
            secure=True,  # set to False for local HTTP dev
            samesite="None",  # required for cross-origin (3000 -> 5000)
            max_age=token_info.get("expires_in", 3600),
        )

        # Refresh token (long-lived)
        resp.set_cookie(
            "spotify_refresh_token",
            token_info["refresh_token"],
            httponly=True,
            secure=True,
            samesite="None",
            max_age=60 * 60 * 24 * 30,  # 30 days
        )

        return resp, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out"}))

    # Clear access token cookie
    resp.set_cookie(
        "spotify_access_token",
        "",
        httponly=True,
        secure=True,  # or False in local dev
        samesite="None",
        max_age=0,  # expire immediately
    )

    # Clear refresh token cookie
    resp.set_cookie(
        "spotify_refresh_token",
        "",
        httponly=True,
        secure=True,
        samesite="None",
        max_age=0,
    )

    return resp, 200


@app.route("/api/spotify/liked-songs", methods=["GET"])
def get_liked_songs():
    """
    Fetches a user's liked songs.
    This endpoint requires an access token passed in the Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing."}), 401

    try:
        token_info = {
            "access_token": auth_header.split(" ")[1],
            # We assume a valid token for this test.
            # In a real app, you'd retrieve the token from your session/DB
            # and check for expiration.
        }

        sp = spotify_utils.create_spotify_client(token_info)
        liked_songs = spotify_utils.get_liked_songs(sp)

        # We'll return just the track names and artists for simplicity
        tracks_data = [
            {
                "name": track["track"]["name"],
                "artist": track["track"]["artists"][0]["name"],
            }
            for track in liked_songs
        ]

        return jsonify({"liked_songs": tracks_data})

    except spotipy.exceptions.SpotifyException as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/api/monthlify/run", methods=["POST"])
def run_monthlify():
    """
    Orchestrates the creation of monthly playlists from a user-provided playlist URL.
    The access token should be provided in the Authorization header.
    The playlist URL should be in the request body.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing."}), 401

    data = request.get_json()
    if not data or "playlist_url" not in data:
        return jsonify({"error": "Playlist URL is missing from the request body."}), 400

    playlist_url = data["playlist_url"]

    try:
        token_info = {
            "access_token": auth_header.split(" ")[1],
        }

        sp = spotify_utils.create_spotify_client(token_info)
        user_info = sp.me()
        user_id = user_info["id"]

        # Step 1: Get tracks from the provided playlist URL
        print(f"Fetching songs from the playlist: {playlist_url}...")
        all_songs = spotify_utils.get_all_playlist_tracks(sp, playlist_url)
        print(f"Found {len(all_songs)} songs.")

        # Step 2: Organize songs by month of addition
        monthly_songs = {}
        for item in all_songs:
            added_at = item["added_at"]
            month_key = added_at[:7]

            if month_key not in monthly_songs:
                monthly_songs[month_key] = []

            # We need the track URI to add it to a new playlist
            monthly_songs[month_key].append(item["track"]["uri"])

        # Step 3: Create playlists and add songs for each month
        for month_key, track_uris in monthly_songs.items():
            year, month = month_key.split("-")
            month_name = get_month_name(int(month))
            playlist_name = f"Monthly - {month_name} {year}"

            print(f"Processing playlist for: {playlist_name}")

            playlist = spotify_utils.get_or_create_playlist(sp, user_id, playlist_name)
            spotify_utils.add_tracks_to_playlist(sp, playlist["id"], track_uris)
            print(f"Added {len(track_uris)} songs to '{playlist_name}'.")

        return jsonify({"message": "Monthly playlists created successfully!"})

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/api/spotify/playlists", methods=["GET"])
def get_user_playlists():
    """
    Fetches all of the user's playlists, including liked songs.
    The access token should be provided in the spotify_access_token cookie.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        # If the access token is missing from the cookie, it's an unauthorized request
        return jsonify({"error": "Authorization cookie is missing."}), 401

    try:
        token_info = {
            "access_token": access_token,
        }

        sp = spotify_utils.create_spotify_client(token_info)

        # Get all playlists and liked songs separately
        playlists = spotify_utils.get_all_user_playlists(sp)
        liked_songs_playlist = spotify_utils.get_liked_songs_as_playlist(sp)

        # Combine the lists and place liked songs at the top
        all_playlists = [liked_songs_playlist] + playlists

        # Return a simplified list for the frontend
        playlists_data = [
            {
                "id": p["id"],
                "name": p["name"],
                "owner": p["owner"]["display_name"],
                "track_count": p["tracks"]["total"],
                "image_url": p["images"][0]["url"] if p["images"] else None,
            }
            for p in all_playlists
        ]

        return jsonify({"playlists": playlists_data})

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/api/spotify/user", methods=["GET"])
def get_user_profile():
    """
    Fetches the profile information for the authenticated user.
    The access token should be provided in the spotify_access_token cookie.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return jsonify({"error": "Authorization cookie is missing."}), 401

    try:
        sp = spotipy.Spotify(auth=access_token)
        user_info = sp.me()

        # We'll return a simplified user object
        user_data = {
            "id": user_info["id"],
            "name": user_info["display_name"],
            "profile_image_url": (
                user_info["images"][0]["url"] if user_info["images"] else None
            ),
        }

        return jsonify(user_data), 200

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


def get_month_name(month_number):
    """
    Helper function to convert a month number to a month name.
    """
    import calendar

    return calendar.month_name[month_number]


# You'll add more endpoints here later for creating playlists, etc.

if __name__ == "__main__":
    # You will use a better method to run the app in production,
    # for now this is fine for local development.
    app.run(debug=True)
