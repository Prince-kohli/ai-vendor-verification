import './globals.css';


import { ToastProvider } from '../../context/ToastContext';
import { ModalProvider } from '../../context/ModalContext';

export const metadata = {
  title: 'AI Vendor Verification Workspace',
  description: 'Enterprise Vendor Verification Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 min-h-screen">
        <ToastProvider>
          <ModalProvider>
            <nav className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
              <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">
                    V
                  </div>
                  <a href="/" className="text-lg font-bold tracking-tight hover:text-blue-400 transition">
                    Vendor Workspace
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
                  <a href="/" className="hover:text-white transition">Dashboard</a>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </main>
          </ModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}