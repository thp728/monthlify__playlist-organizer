"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { PlaylistLink } from "@/components/custom/PlaylistLink";
import { usePlaylistStore } from "@/store/playlistStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const { newPlaylists, clearPlaylists } = usePlaylistStore();
  const router = useRouter();

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center m-4 dark:bg-gray-900 w-full">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 size={64} className="text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold">Success!</CardTitle>
          <CardDescription className="text-md">
            Your monthly playlists have been created.
            <br />
            You can find them in your Spotify account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">Your new playlists:</h3>
          <div className="flex flex-col items-center space-y-2">
            {newPlaylists.length > 0 ? (
              newPlaylists.map((playlist) => (
                <PlaylistLink
                  key={playlist.url}
                  name={playlist.name}
                  url={playlist.url}
                />
              ))
            ) : (
              <p className="text-gray-500">No playlists found.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant={"ghost"} className="mt-5" onClick={goToDashboard}>
            Monthlify Another Playlist
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
