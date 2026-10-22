// Placeholders shown the moment a page is opened, while its data is still on the way from the database.
// Plain server markup with no data, so it can appear instantly.

const block = 'animate-pulse rounded-2xl bg-slate-200';

// Public pages: a dark photo hero followed by content cards.
export function PublicPageSkeleton({ hero = 'tall' }: { hero?: 'tall' | 'short' }) {
  return (
    <div className="min-h-screen bg-slate-50" aria-busy="true" aria-label="Loading">
      <div className={`theme-fixed flex flex-col items-center justify-center gap-4 bg-ocean-900 ${hero === 'tall' ? 'h-[70vh]' : 'h-72'}`}>
        <div className="h-3 w-32 animate-pulse rounded-full bg-white/15" />
        <div className="h-10 w-72 max-w-[80%] animate-pulse rounded-full bg-white/20" />
        <div className="h-3 w-96 max-w-[85%] animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="relative mx-auto -mt-12 max-w-6xl space-y-6 px-4 pb-16 sm:px-6">
        <div className={`${block} h-24 bg-white shadow-xl shadow-ocean-900/5`} />
        <div className="grid gap-6 md:grid-cols-2">
          <div className={`${block} h-72`} />
          <div className={`${block} h-72`} />
        </div>
        <div className={`${block} h-40`} />
      </div>
    </div>
  );
}

// Admin pages: only the content area, so the sidebar and header stay in place.
export function AdminPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className={`${block} h-28`} />
        ))}
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className={`${block} h-36`} />
      ))}
    </div>
  );
}
