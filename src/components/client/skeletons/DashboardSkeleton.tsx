export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 pb-24 md:p-8 font-sans overflow-x-hidden animate-pulse">
            <div className="max-w-md mx-auto lg:max-w-4xl pt-2">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/10" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-white/10 rounded" />
                            <div className="h-3 w-32 bg-white/10 rounded" />
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                    <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                </div>

                {/* Next Session Skeleton */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <div className="h-6 w-32 bg-white/10 rounded" />
                        <div className="h-4 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="h-64 rounded-[2rem] bg-white/5 border border-white/5" />
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="h-6 w-24 bg-white/10 rounded mb-2" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
