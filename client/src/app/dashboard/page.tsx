"use client";

import { Dashboard } from "@/components/custom/Dashboard";
import { Playlist } from "@/models/playlist";

export default function DashboardPage() {
  const imgUrl = "https://placehold.co/400x400/png";
  const userPlaylists: Playlist[] = [
    {
      id: "1",
      name: "My Liked Songs",
      imageUrl: imgUrl,
      numberOfSongs: 10,
    },
    {
      id: "2",
      name: "Workout Jams",
      imageUrl: imgUrl,
      numberOfSongs: 10,
    },
    {
      id: "3",
      name: "Chill Vibes",
      imageUrl: imgUrl,
      numberOfSongs: 10,
    },
    {
      id: "4",
      name: "Coding Music",
      imageUrl: imgUrl,
      numberOfSongs: 10,
    },
    { id: "5", name: "Road Trip", imageUrl: imgUrl, numberOfSongs: 10 },
    { id: "6", name: "Focus", imageUrl: imgUrl, numberOfSongs: 10 },
    { id: "7", name: "Throwback", imageUrl: imgUrl, numberOfSongs: 10 },
    {
      id: "8",
      name: "Morning Coffee",
      imageUrl: imgUrl,
      numberOfSongs: 10,
    },
  ];

  return <Dashboard userPlaylists={userPlaylists} />;
}
