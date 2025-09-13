import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onLogin: () => void;
}

export function HeroSection({ onLogin }: HeroSectionProps) {
  return (
    <div>
      <section className="flex max-w-2xl flex-col items-center justify-center space-y-4 text-center">
        {/* App Name */}
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Monthlify
        </h1>

        {/* Catchy Title */}
        <h2 className="text-3xl font-semibold tracking-tight text-gray-800">
          Your Music, Sorted by the Month.
        </h2>

        {/* Subtitle */}
        <p className="max-w-prose text-lg text-gray-600">
          Transform your favorite playlist into a monthly collection. Rediscover
          what you were listening to during any month of the year.
        </p>

        {/* Login Button */}
        <Button
          onClick={onLogin}
          className="mt-8 text-lg font-semibold px-8 py-6"
        >
          Login with Spotify
        </Button>
      </section>
    </div>
  );
}
