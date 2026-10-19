'use client';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const duration = toast.duration || 4000;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center justify-between px-4 py-3.5 rounded-xl shadow-xl text-white min-w-[300px] max-w-md transition-all transform duration-300 animate-slide-in ${
              toast.type === 'error'
                ? 'bg-rose-600'
                : toast.type === 'success'
                ? 'bg-emerald-600'
                : 'bg-indigo-600'
            }`}
          >
            <div className="flex items-center gap-2.5 pr-2">
              <span className="text-base font-bold">
                {toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}
              </span>
              <span className="text-xs font-semibold leading-tight">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-white/70 hover:text-white font-bold text-sm transition"
            >
              ✕
            </button>

            {/* Animated Progress Line at the bottom */}
            <div className="absolute bottom-0 left-0 h-1 bg-black/20 w-full">
              <div
                className="h-full bg-white/80"
                style={{
                  animation: `toastProgress ${duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes toastProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}