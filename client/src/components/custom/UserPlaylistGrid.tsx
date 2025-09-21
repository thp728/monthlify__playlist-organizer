"use client";

import React, { useState } from "react";
import { PlaylistCard } from "./PlaylistCard";
import { Input } from "@/components/ui/input";
import { SimplifiedPlaylist } from "@/lib/types/api";
import { Search } from "lucide-react";

interface UserPlaylistGridProps {
  playlists: SimplifiedPlaylist[];
  selectedPlaylistId: string | null;
  onPlaylistClick: (playlistId: string) => void;
  isSearchEnabled?: boolean;
}

export function UserPlaylistGrid({
  playlists,
  selectedPlaylistId,
  onPlaylistClick,
  isSearchEnabled = true,
}: UserPlaylistGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Search Bar */}
      {isSearchEnabled && (
        <div className="flex justify-center">
          <div className="relative w-4/6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for a playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10" // add padding-left so text doesn’t overlap with the icon
            />
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      <div className="grid h-full flex-grow gap-4 overflow-y-auto pr-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 p-5">
        {filteredPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlistName={playlist.name}
            albumCoverUrl={playlist.image_url}
            numberOfSongs={playlist.track_count}
            onClick={() => onPlaylistClick(playlist.id)}
            isSelected={selectedPlaylistId === playlist.id}
          />
        ))}
      </div>
    </div>
  );
}
