import Image from "next/image";

interface PlaylistCardProps {
  playlistName: string;
  albumCoverUrl: string;
  onClick: () => void;
  isSelected: boolean;
}

export function PlaylistCard({
  playlistName,
  albumCoverUrl,
  onClick,
  isSelected,
}: PlaylistCardProps) {
  const selectedStyle = isSelected
    ? "border-4 border-blue-500"
    : "border-4 border-transparent";

  return (
    <div
      className={`cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${selectedStyle}`}
      onClick={onClick}
    >
      <Image
        src={albumCoverUrl}
        alt={`Album cover for ${playlistName}`}
        width={200}
        height={200}
        className="w-full h-auto object-cover"
      />
      <div className="p-2 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {playlistName}
        </h3>
      </div>
    </div>
  );
}
