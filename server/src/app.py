from flask import Flask, jsonify, request, make_response
import os
from flask_cors import CORS
from . import image_utils, spotify_utils, auth

from io import BytesIO
from flask import send_file

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


@app.route("/api/preview", methods=["POST"])
def preview_playlist():
    """
    Fetches a preview of monthly playlists from a given Spotify playlist URL, ID, or liked songs.
    The access token is retrieved from the spotify_access_token cookie.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return jsonify({"error": "Authorization cookie is missing."}), 401

    try:
        sp = spotipy.Spotify(auth=access_token)
        data = request.get_json()
        identifier = data.get("identifier")
        identifier_type = data.get("type")

        if not identifier:
            return jsonify({"error": "Playlist identifier is required"}), 400

        if identifier_type == "id":
            if identifier == "liked-songs":
                preview_data = spotify_utils.get_monthly_previews_from_liked_songs(sp)
            else:
                preview_data = spotify_utils.get_monthly_previews_from_id(
                    sp, identifier
                )
        elif identifier_type == "url":
            preview_data = spotify_utils.get_monthly_previews_from_url(sp, identifier)
        else:
            return jsonify({"error": "Invalid identifier type"}), 400

        return jsonify({"preview_data": preview_data}), 200

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return jsonify({"error": "Spotify API Error: " + str(e)}), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route("/api/images/cover/<month_code>/<year>", methods=["GET"])
def get_playlist_cover(month_code, year):
    """
    API endpoint to generate and serve a playlist cover image.
    Example URL: /api/images/cover/JAN/2024
    """
    try:
        # Generate the image
        img = image_utils.create_playlist_cover(month_code.upper(), int(year))

        # Save the image to a byte stream
        img_io = BytesIO()
        img.save(img_io, "PNG")
        img_io.seek(0)

        return send_file(img_io, mimetype="image/png")

    except ValueError:
        return {"error": "Invalid month or year format"}, 400


@app.route("/api/create-monthly-playlists", methods=["POST"])
def create_monthly_playlists():
    """
    API endpoint to create multiple new playlists, add tracks, and upload a custom cover image to each.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return jsonify({"error": "Authorization cookie is missing."}), 401

    data = request.get_json()
    monthly_playlists_details = data.get("playlists")
    identifier = data.get("identifier")
    identifier_type = data.get("type")

    if not all([monthly_playlists_details, identifier, identifier_type]):
        return jsonify({"error": "Missing 'playlists' data in the request body."}), 400

    try:
        sp = spotipy.Spotify(auth=access_token)
        user_id = sp.me()["id"]

        if identifier_type == "id":
            if identifier == "liked-songs":
                source_playlist_name = "Liked Songs"
            else:
                source_playlist_name = spotify_utils.get_playlist_name_from_identifier(
                    sp, identifier
                )
        elif identifier_type == "url":
            source_playlist_name = spotify_utils.get_playlist_name_from_identifier(
                sp, identifier
            )
        else:
            return jsonify({"error": "Invalid identifier type"}), 400

        successful_playlists = []
        for playlist_data in monthly_playlists_details:
            playlist_name = playlist_data.get("name")
            songs_list = playlist_data.get("songs", [])

            if not playlist_name:
                continue

            track_uris = [song["id"] for song in songs_list if "id" in song]

            if not track_uris:
                continue

            # Create the playlist
            new_playlist = spotify_utils.create_playlist_with_tracks(
                sp=sp,
                user_id=user_id,
                source_playlist_name=source_playlist_name,
                playlist_name=playlist_name,
                track_uris=track_uris,
            )

            # Get month and year for the cover image from the playlist name: Feb 2025
            name_parts = playlist_name.split()
            month_code = name_parts[0][:3].upper()
            year = name_parts[1]

            # Generate and upload the cover image
            img = image_utils.create_playlist_cover(month_code, int(year))
            img_io = BytesIO()
            img.save(img_io, "JPEG", quality=85, optimize=True)  # keep under 256 KB
            img_io.seek(0)

            result = spotify_utils.upload_playlist_cover_image(
                sp, new_playlist["id"], img_io
            )

            successful_playlists.append(
                {
                    "name": new_playlist["name"],
                    "id": new_playlist["id"],
                    "url": new_playlist["external_urls"]["spotify"],
                }
            )

        return (
            jsonify(
                {
                    "message": "Playlists created successfully!",
                    "playlists": successful_playlists,
                }
            ),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
