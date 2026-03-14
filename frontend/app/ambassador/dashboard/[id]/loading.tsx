export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow p-6 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                <div className="h-8 bg-gray-200 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl shadow p-6 space-y-4">
                        <div className="h-5 bg-gray-200 rounded w-1/4" />
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
