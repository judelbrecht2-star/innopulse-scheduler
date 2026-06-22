import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="ip-eyebrow">404</p>
        <h1>This page is not available.</h1>
        <p className="mt-4 text-muted-foreground">
          The scheduling link may have changed or the event type is inactive.
        </p>
        <Button asChild className="mt-7">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
