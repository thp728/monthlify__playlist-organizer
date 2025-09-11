import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onLogin: () => void;
}

export function HeroSection({ onLogin }: HeroSectionProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full h-full text-center flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Monthlify</h1>
      <p className="text-lg text-gray-600 mb-8">
        Organize your Spotify playlists by month. Remember what you were
        listening to and when.
      </p>
      <Button onClick={onLogin}>Log in with Spotify</Button>
    </div>
  );
}
