import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  errorTitle: string;
  errorMessage: string;
  onRetry: () => void;
}

export function ErrorCard({
  errorTitle,
  errorMessage,
  onRetry,
}: ErrorCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col justify-center items-center text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <CardTitle className="mt-2 text-destructive">{errorTitle}</CardTitle>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}
