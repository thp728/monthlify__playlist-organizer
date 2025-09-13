import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  loadingText: string;
}

export default function LoadingSpinner({ loadingText }: LoadingSpinnerProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center space-y-2 p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">{loadingText}</p>
      </div>
    </div>
  );
}
