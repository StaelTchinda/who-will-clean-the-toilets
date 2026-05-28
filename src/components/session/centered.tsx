export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center md:justify-start md:pt-[18vh]">
        {children}
      </div>
    </main>
  );
}
