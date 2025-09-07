# monthlify/server/src/app.py

from flask import Flask, jsonify, request
import os
from . import spotify_utils, auth

import spotipy

app = Flask(__name__)

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
    """
    Handles the callback from Spotify after the user logs in.
    Exchanges the authorization code for an access token.
    """
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
        # Here you would store the token_info securely,
        # perhaps in a session or a database.
        # For this example, we'll just return it.
        return jsonify(token_info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    Orchestrates the creation of monthly playlists from a user's liked songs.
    The access token should be provided in the Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing."}), 401

    try:
        token_info = {
            "access_token": auth_header.split(" ")[1],
        }

        sp = spotify_utils.create_spotify_client(token_info)
        user_info = sp.me()
        user_id = user_info["id"]

        # Step 1: Get all liked songs
        print("Fetching all liked songs...")
        all_liked_songs = spotify_utils.get_all_liked_songs(sp)
        print(f"Found {len(all_liked_songs)} liked songs.")

        # Step 2: Organize songs by month
        monthly_songs = {}
        for item in all_liked_songs:
            added_at = item["added_at"]
            # Format the date to get 'YYYY-MM'
            month_key = added_at[:7]

            if month_key not in monthly_songs:
                monthly_songs[month_key] = []

            monthly_songs[month_key].append(item["track"]["uri"])

        # Step 3: Create playlists and add songs for each month
        for month_key, track_uris in monthly_songs.items():
            year, month = month_key.split("-")
            month_name = get_month_name(int(month))
            playlist_name = f"Liked Songs - {month_name} {year}"

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
