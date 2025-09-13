import Image from "next/image";

interface PlaylistCardProps {
  playlistName: string;
  albumCoverUrl: string;
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

  return (
    <div
      className={`relative cursor-pointer rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ${selectedStyle}`}
      onClick={onClick}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={albumCoverUrl}
          alt={`Album cover for ${playlistName}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="rounded-lg object-cover"
        />
        <div className="absolute bottom-0 right-0 m-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {numberOfSongs} songs
        </div>
      </div>
      <div className="p-2">
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {playlistName}
        </h3>
      </div>
    </div>
  );
}
