import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PlaylistLinkProps {
  name: string;
  url: string;
}

export const PlaylistLink = ({ name, url }: PlaylistLinkProps) => {
  return (
    <Button asChild variant="link" className="p-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2"
      >
        <span>{name}</span>
        <ExternalLink size={16} />
      </a>
    </Button>
  );
};
