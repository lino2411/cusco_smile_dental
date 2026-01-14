// src/components/Layout.jsx
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <main className="flex-1 bg-gray-100 overflow-x-hidden">
                {/* margen interno razonable y contenido centrado */}
                <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
