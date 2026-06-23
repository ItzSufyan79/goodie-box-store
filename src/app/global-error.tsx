"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center px-4">
            <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
