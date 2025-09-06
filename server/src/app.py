# monthlify/server/src/app.py

from flask import Flask, jsonify, request
import os
from . import spotify_utils, auth

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


# You'll add more endpoints here later for creating playlists, etc.

if __name__ == "__main__":
    # You will use a better method to run the app in production,
    # for now this is fine for local development.
    app.run(debug=True)
