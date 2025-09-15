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
import { PlaylistAction, usePlaylistStore } from "@/store/playlistStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const { newPlaylists, clearPlaylists } = usePlaylistStore();
  const router = useRouter();

  const createdPlaylists = newPlaylists.filter(
    (playlist) => playlist.action === PlaylistAction.Created
  );
  const updatedPlaylists = newPlaylists.filter(
    (playlist) => playlist.action === PlaylistAction.Updated
  );

  const goToDashboard = () => {
    clearPlaylists();
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
            Your monthly playlists have been processed.
            <br />
            You can find them in your Spotify account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {newPlaylists.length > 0 ? (
            <>
              {createdPlaylists.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">
                    Newly Created Playlists:
                  </h3>
                  <div className="flex flex-col items-center space-y-2">
                    {createdPlaylists.map((playlist) => (
                      <PlaylistLink
                        key={playlist.url}
                        name={playlist.name}
                        url={playlist.url}
                      />
                    ))}
                  </div>
                </div>
              )}

              {updatedPlaylists.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-blue-600">
                    Updated Playlists:
                  </h3>
                  <div className="flex flex-col items-center space-y-2">
                    {updatedPlaylists.map((playlist) => (
                      <PlaylistLink
                        key={playlist.url}
                        name={playlist.name}
                        url={playlist.url}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">No playlists found.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant={"ghost"} className="mt-2" onClick={goToDashboard}>
            Monthlify Another Playlist
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
