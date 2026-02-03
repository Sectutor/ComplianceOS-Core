import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
            <div className="flex mb-4 gap-2">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">Page Not Found</p>

            <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
                Return to Home
            </Link>
        </div>
    );
}
