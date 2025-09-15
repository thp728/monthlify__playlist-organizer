import base64
import urllib.parse
from typing import Any, Dict

import requests

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


def get_spotify_auth_url(client_id: str, redirect_uri: str) -> str:
    """
    Constructs the Spotify authorization URL.
    """
    scopes = (
        "playlist-read-private "
        "playlist-modify-private "
        "playlist-modify-public "
        "user-library-read "
        "ugc-image-upload"
    )

    params: Dict[str, str] = {
        "response_type": "code",
        "client_id": client_id,
        "scope": scopes,
        "redirect_uri": redirect_uri,
    }

    return f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"


def get_spotify_token(
    client_id: str, client_secret: str, redirect_uri: str, code: str
) -> Dict[str, Any]:
    """
    Exchanges the authorization code for an access token and a refresh token.
    """
    headers: Dict[str, str] = {
        "Authorization": "Basic "
        + base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    }

    payload: Dict[str, str] = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=payload, headers=headers)

    response.raise_for_status()

    return response.json()
