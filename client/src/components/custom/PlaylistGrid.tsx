"use client";

import React, { useState } from "react";
import { PlaylistCard } from "./PlaylistCard";
import { Input } from "@/components/ui/input";
import { Playlist } from "@/models/playlist";

interface PlaylistGridProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onPlaylistClick: (playlistId: string) => void;
  isSearchEnabled?: boolean;
}

export function PlaylistGrid({
  playlists,
  selectedPlaylistId,
  onPlaylistClick,
  isSearchEnabled = true,
}: PlaylistGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Search Bar */}
      {isSearchEnabled && (
        <div className="flex justify-center">
          <Input
            className="w-4/6"
            type="text"
            placeholder="Search for a playlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Playlist Grid */}
      <div className="grid h-full flex-grow gap-4 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 p-5">
        {filteredPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlistName={playlist.name}
            albumCoverUrl={playlist.imageUrl}
            numberOfSongs={playlist.numberOfSongs}
            onClick={() => onPlaylistClick(playlist.id)}
            isSelected={selectedPlaylistId === playlist.id}
          />
        ))}
      </div>
    </div>
  );
}
