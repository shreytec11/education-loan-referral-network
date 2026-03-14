export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}
