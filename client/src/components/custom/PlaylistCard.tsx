import Image from "next/image";

interface PlaylistCardProps {
  playlistName: string;
  albumCoverUrl: string | null; // The URL can now be null
  numberOfSongs: number;
  onClick: () => void;
  isSelected?: boolean;
}

export function PlaylistCard({
  playlistName,
  albumCoverUrl,
  numberOfSongs,
  onClick,
  isSelected = false,
}: PlaylistCardProps) {
  const selectedStyle = isSelected
    ? "ring-4 ring-blue-500 ring-offset-2"
    : "border-4 border-transparent";

  const isLikedSongs = playlistName === "Liked Songs";
  // Check if the album cover URL is from a mosaic source
  const isMosaic = albumCoverUrl?.includes("mosaic");
  // Use a placeholder image if the URL is null or undefined
  const finalImageUrl = isLikedSongs
    ? "/images/liked-songs.png"
    : albumCoverUrl || "https://placehold.co/640x640/png";

  return (
    <div
      className={`relative cursor-pointer rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ${selectedStyle}`}
      onClick={onClick}
    >
      <div className="relative w-full aspect-square">
        {isMosaic || isLikedSongs ? (
          // Use a standard <img> tag for mosaic images to prevent 500 errors
          <img
            src={finalImageUrl}
            alt={`Album cover for ${playlistName}`}
            width={300} // Setting fixed dimensions is crucial for <img>
            height={300}
            className="rounded-lg object-cover"
          />
        ) : (
          // Use the Next.js Image component for other images
          <Image
            src={finalImageUrl}
            alt={`Album cover for ${playlistName}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="rounded-lg object-cover"
          />
        )}
        <div className="absolute bottom-0 right-0 m-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {numberOfSongs} songs
        </div>
      </div>
      <div className="p-2">
        <h3
          className="text-sm font-semibold text-gray-800 truncate"
          title={playlistName}
        >
          {playlistName}
        </h3>
      </div>
    </div>
  );
}
