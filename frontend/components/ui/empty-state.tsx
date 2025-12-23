import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionUrl,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
      <Ghost className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-center text-sm mb-4">
        {description}
      </p>
      {actionLabel && actionUrl && (
        <Button asChild>
          <Link href={actionUrl}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}


