import { Compass } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export function NotFoundRoute() {
  return (
    <EmptyState
      icon={<Compass className="size-5" />}
      title="Nothing here"
      description="That page doesn't exist in this workspace."
      action={
        <Button asChild size="sm" className="mt-2">
          <Link to="/w/default">Back to workspace</Link>
        </Button>
      }
    />
  );
}
