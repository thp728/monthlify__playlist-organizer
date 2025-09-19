import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export function Footer() {
  const githubRepoUrl =
    "https://github.com/thp728/monthlify__playlist-organizer";
  const githubProfileUrl = "https://github.com/thp728";

  return (
    <footer className="w-9/10 border-t border-gray-200 py-4 mt-8">
      <div className="container flex justify-center items-center text-sm text-gray-500 px-4 space-x-2">
        <span>
          Made with ❤️ and 🍺 by{" "}
          <Link
            href={githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:border-b hover:border-gray-700 transition-colors duration-200 py-0.5"
          >
            Tejas Page
          </Link>
        </span>
        <Link
          href={githubRepoUrl}
          className="hover:text-gray-700 transition-colors duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub size={18} />
        </Link>
      </div>
    </footer>
  );
}
