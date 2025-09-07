# monthlify/server/src/auth.py

import os
import urllib.parse
import base64
import requests

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


def get_spotify_auth_url(client_id, redirect_uri):
    """
    Constructs the Spotify authorization URL.
    The user will be redirected to this URL to log in and grant permissions.
    """
    scopes = "playlist-read-private playlist-modify-private user-library-read"

    params = {
        "response_type": "code",
        "client_id": client_id,
        "scope": scopes,
        "redirect_uri": redirect_uri,
    }

    return f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"


def get_spotify_token(client_id, client_secret, redirect_uri, code):
    """
    Exchanges the authorization code for an access token and a refresh token.
    """
    headers = {
        "Authorization": "Basic "
        + base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    }

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=payload, headers=headers)

    response.raise_for_status()

    return response.json()
