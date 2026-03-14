export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-lg shadow p-5 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-2/3" />
                                <div className="h-8 bg-gray-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-9 bg-gray-200 rounded-md w-20" />
                            ))}
                        </div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
