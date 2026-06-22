export default function BookingLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <span className="mx-auto block size-9 animate-pulse rounded-button bg-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading booking page…</p>
      </div>
    </main>
  );
}
