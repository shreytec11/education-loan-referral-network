import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-4xl font-extrabold text-blue-900 mb-4">404</h2>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h3>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-blue-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-800 transition shadow-md"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
}
