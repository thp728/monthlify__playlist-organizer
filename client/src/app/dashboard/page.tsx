"use client";

import { Dashboard } from "@/components/custom/Dashboard";

interface Playlist {
  id: string;
  name: string;
  imageUrl: string;
}

export default function DashboardPage() {
  const imgUrl = "https://placehold.co/400x400/png";
  const userPlaylists: Playlist[] = [
    {
      id: "1",
      name: "My Liked Songs",
      imageUrl: imgUrl,
    },
    {
      id: "2",
      name: "Workout Jams",
      imageUrl: imgUrl,
    },
    {
      id: "3",
      name: "Chill Vibes",
      imageUrl: imgUrl,
    },
    {
      id: "4",
      name: "Coding Music",
      imageUrl: imgUrl,
    },
    { id: "5", name: "Road Trip", imageUrl: imgUrl },
    { id: "6", name: "Focus", imageUrl: imgUrl },
    { id: "7", name: "Throwback", imageUrl: imgUrl },
    {
      id: "8",
      name: "Morning Coffee",
      imageUrl: imgUrl,
    },
  ];

  return (
    <main className="h-screen flex justify-center items-center bg-gray-50 p-10">
      <Dashboard userPlaylists={userPlaylists} />
    </main>
  );
}
