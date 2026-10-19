'use client';

export default function Badge({ status }) {
  const styles = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
    'Under Review': 'bg-amber-50 text-amber-800 border-amber-300',
    'Action Required': 'bg-rose-50 text-red-700 border-red-300 font-semibold',
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    'Rejected': 'bg-red-100 text-red-900 border-red-400 font-semibold',
    'Verified': 'bg-emerald-100 text-emerald-800 border-emerald-400',
    'Mismatch': 'bg-amber-100 text-amber-900 border-amber-400',
    'Unable to Verify': 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles[status] || defaultStyle}`}>
      {status || 'Unknown'}
    </span>
  );
}