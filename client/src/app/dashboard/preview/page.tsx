"use client";

import { Preview } from "@/components/custom/Preview";

interface Song {
  id: string;
  name: string;
  artist: string;
}

interface PlaylistDetail {
  id: string;
  name: string;
  imageUrl: string;
  songs: Song[];
}

export default function PreviewPage() {
  const dummySongs: Song[] = [
    { id: "1", name: "Midnight Drive", artist: "Neon Waves" },
    { id: "2", name: "Lost in Echoes", artist: "Crystal Skies" },
    { id: "3", name: "Golden Horizon", artist: "Aurora Lights" },
    { id: "4", name: "Falling Stars", artist: "Velvet Dreams" },
    { id: "5", name: "City Lights", artist: "The Night Owls" },
    { id: "6", name: "Wandering Soul", artist: "Echo Valley" },
    { id: "7", name: "Summer Breeze", artist: "Coastal Waves" },
    { id: "8", name: "Silent Whispers", artist: "Moonlit Echo" },
    { id: "9", name: "Electric Pulse", artist: "Skyline Beats" },
    { id: "10", name: "Beyond the Horizon", artist: "Nova Trails" },
  ];
  const imgUrl = "https://placehold.co/400x400/png";
  const userPlaylists: PlaylistDetail[] = [
    {
      id: "1",
      name: "January",
      imageUrl: imgUrl,
      songs: dummySongs,
    },
    {
      id: "2",
      name: "February",
      imageUrl: imgUrl,
      songs: dummySongs,
    },
    {
      id: "3",
      name: "March",
      imageUrl: imgUrl,
      songs: dummySongs,
    },
    {
      id: "4",
      name: "April",
      imageUrl: imgUrl,
      songs: dummySongs,
    },
    { id: "5", name: "May", imageUrl: imgUrl, songs: dummySongs },
    { id: "6", name: "June", imageUrl: imgUrl, songs: dummySongs },
    { id: "7", name: "July", imageUrl: imgUrl, songs: dummySongs },
    {
      id: "8",
      name: "August",
      imageUrl: imgUrl,
      songs: dummySongs,
    },
  ];

  return (
    <main className="h-full flex justify-center items-center bg-gray-50 m-5">
      <Preview userPlaylists={userPlaylists} />
    </main>
  );
}
