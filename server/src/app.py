import os
from io import BytesIO
from typing import Any, Dict, List, Optional, Union, cast

import spotipy
from flask import Flask, Response, jsonify, make_response, request, send_file
from flask_cors import CORS

from . import auth, image_utils, spotify_utils
from .models.spotify_types import (
    SimplifiedPlaylist,
    UserProfile,
)

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config["SPOTIFY_CLIENT_ID"] = os.getenv("SPOTIFY_CLIENT_ID")
app.config["SPOTIFY_CLIENT_SECRET"] = os.getenv("SPOTIFY_CLIENT_SECRET")
app.config["SPOTIFY_REDIRECT_URI"] = os.getenv("SPOTIFY_REDIRECT_URI")


@app.route("/")
def home() -> Dict[str, str]:
    """
    A simple root endpoint to check if the server is running.
    """
    return {"message": "Welcome to the Monthlify API!"}


@app.route("/api/auth/login", methods=["GET"])
def spotify_login() -> Dict[str, str]:
    """
    Redirects the user to the Spotify authorization page.
    """
    auth_url = auth.get_spotify_auth_url(
        client_id=cast(str, app.config["SPOTIFY_CLIENT_ID"]),
        redirect_uri=cast(str, app.config["SPOTIFY_REDIRECT_URI"]),
    )
    return {"auth_url": auth_url}


@app.route("/api/auth/callback", methods=["GET"])
def spotify_callback() -> tuple[Response, int]:
    code = request.args.get("code")
    if not code:
        return make_response(jsonify({"error": "No authorization code provided."})), 400

    try:
        token_info = auth.get_spotify_token(
            client_id=cast(str, app.config["SPOTIFY_CLIENT_ID"]),
            client_secret=cast(str, app.config["SPOTIFY_CLIENT_SECRET"]),
            redirect_uri=cast(str, app.config["SPOTIFY_REDIRECT_URI"]),
            code=code,
        )

        resp = make_response(jsonify({"message": "Authentication successful."}))

        resp.set_cookie(
            "spotify_access_token",
            token_info["access_token"],
            httponly=True,
            secure=True,
            samesite="None",
            max_age=token_info.get("expires_in", 3600),
        )

        resp.set_cookie(
            "spotify_refresh_token",
            token_info["refresh_token"],
            httponly=True,
            secure=True,
            samesite="None",
            max_age=60 * 60 * 24 * 30,
        )

        return resp, 200

    except Exception as e:
        return make_response(jsonify({"error": str(e)})), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout() -> tuple[Response, int]:
    resp = make_response(jsonify({"message": "Logged out"}))

    resp.set_cookie(
        "spotify_access_token",
        "",
        httponly=True,
        secure=True,
        samesite="None",
        max_age=0,
    )

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
def get_user_playlists() -> tuple[Response, int]:
    """
    Fetches all of the user's playlists, including liked songs.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return (
            make_response(jsonify({"error": "Authorization cookie is missing."})),
            401,
        )

    try:
        token_info = {
            "access_token": access_token,
        }

        sp = spotify_utils.create_spotify_client(token_info)

        playlists = spotify_utils.get_all_user_playlists(sp)
        liked_songs_playlist = spotify_utils.get_liked_songs_as_playlist(sp)

        all_playlists = [liked_songs_playlist] + playlists

        playlists_data: List[SimplifiedPlaylist] = [
            {
                "id": p["id"],
                "name": p["name"],
                "owner": p["owner"]["display_name"],
                "track_count": p["tracks"]["total"],
                "image_url": p["images"][0]["url"] if p["images"] else None,
            }
            for p in all_playlists
        ]

        return make_response(jsonify({"playlists": playlists_data})), 200

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return make_response(jsonify({"error": str(e)})), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return make_response(jsonify({"error": "An unexpected error occurred."})), 500


@app.route("/api/spotify/user", methods=["GET"])
def get_user_profile() -> tuple[Response, int]:
    """
    Fetches the profile information for the authenticated user.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return (
            make_response(jsonify({"error": "Authorization cookie is missing."})),
            401,
        )

    try:
        sp = spotipy.Spotify(auth=access_token)
        user_info = sp.me()

        user_data: UserProfile = {
            "id": user_info["id"],
            "display_name": user_info["display_name"],
            "images": user_info["images"],
        }

        return make_response(jsonify(user_data)), 200

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return make_response(jsonify({"error": str(e)})), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return make_response(jsonify({"error": "An unexpected error occurred."})), 500


@app.route("/api/preview", methods=["POST"])
def preview_playlist() -> tuple[Response, int]:
    """
    Fetches a preview of monthly playlists
    from a given Spotify playlist URL, ID, or liked songs.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return (
            make_response(jsonify({"error": "Authorization cookie is missing."})),
            401,
        )

    try:
        sp = spotipy.Spotify(auth=access_token)
        data = request.get_json()
        identifier: Optional[str] = data.get("identifier")
        identifier_type: Optional[str] = data.get("type")

        if not identifier or not identifier_type:
            return (
                make_response(jsonify({"error": "Playlist identifier is required"})),
                400,
            )

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
            return make_response(jsonify({"error": "Invalid identifier type"})), 400

        return make_response(jsonify({"preview_data": preview_data})), 200

    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API Error: {e}")
        return make_response(jsonify({"error": "Spotify API Error: " + str(e)})), 401
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return make_response(jsonify({"error": "An unexpected error occurred."})), 500


@app.route("/api/images/cover/<month_code>/<year>", methods=["GET"])
def get_playlist_cover(
    month_code: str, year: str
) -> Union[Response, tuple[Response, int]]:
    """
    API endpoint to generate and serve a playlist cover image.
    """
    try:
        img = image_utils.create_playlist_cover(month_code.upper(), int(year))

        img_io = BytesIO()
        img.save(img_io, "PNG")
        img_io.seek(0)

        return send_file(img_io, mimetype="image/png")

    except ValueError:
        return make_response(jsonify({"error": "Invalid month or year format"})), 400


@app.route("/api/create-monthly-playlists", methods=["POST"])
def create_monthly_playlists() -> tuple[Response, int]:
    """
    API endpoint to create:
        multiple new playlists
        add tracks
        and upload a custom cover image to each.
    """
    access_token = request.cookies.get("spotify_access_token")

    if not access_token:
        return (
            make_response(jsonify({"error": "Authorization cookie is missing."})),
            401,
        )

    data = request.get_json()
    monthly_playlists_details: List[Dict[str, Any]] = data.get("playlists", [])
    identifier: Optional[str] = data.get("identifier")
    identifier_type: Optional[str] = data.get("type")

    if not monthly_playlists_details:
        return (
            make_response(
                jsonify({"error": "Missing 'playlists' data in the request body."})
            ),
            400,
        )

    if not identifier or not identifier_type:
        return (
            make_response(
                jsonify(
                    {
                        "error": (
                            "Missing 'identifier' or 'identifier_type' "
                            "in the request body."
                        )
                    }
                )
            ),
            400,
        )

    try:
        sp = spotipy.Spotify(auth=access_token)
        user_id = sp.me()["id"]

        source_playlist_name: Optional[str]
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
            return make_response(jsonify({"error": "Invalid identifier type"})), 400

        if not source_playlist_name:
            return (
                make_response(
                    jsonify({"error": "Could not determine source playlist name."})
                ),
                400,
            )

        successful_playlists: List[Dict[str, Any]] = []
        for playlist_data in monthly_playlists_details:
            playlist_name = playlist_data.get("name")
            songs_list = playlist_data.get("songs", [])

            if not playlist_name:
                continue

            track_uris = [song["id"] for song in songs_list if "id" in song]

            if not track_uris:
                continue

            result_dict = spotify_utils.create_playlist_with_tracks(
                sp=sp,
                user_id=user_id,
                source_playlist_name=source_playlist_name,
                playlist_name=playlist_name,
                track_uris=track_uris,
            )

            new_playlist = result_dict["playlist"]
            action_taken = result_dict["action_taken"]

            name_parts = playlist_name.split()
            month_code = name_parts[0][:3].upper()
            year = name_parts[1]

            img = image_utils.create_playlist_cover(month_code, int(year))
            img_io = BytesIO()
            img.save(img_io, "JPEG", quality=85, optimize=True)
            img_io.seek(0)

            spotify_utils.upload_playlist_cover_image(sp, new_playlist["id"], img_io)

            successful_playlists.append(
                {
                    "name": new_playlist["name"],
                    "id": new_playlist["id"],
                    "url": new_playlist["external_urls"]["spotify"],
                    "action": action_taken,
                }
            )

        return (
            make_response(
                jsonify(
                    {
                        "message": "Playlists processed successfully!",
                        "playlists": successful_playlists,
                    }
                )
            ),
            201,
        )
    except Exception as e:
        return make_response(jsonify({"error": str(e)})), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
