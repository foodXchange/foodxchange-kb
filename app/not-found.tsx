export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <p className="text-4xl mb-4">📄</p>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Page not found
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        This article or page does not exist.
      </p>
      <a
        href="/"
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
      >
        Back to KB home
      </a>
    </div>
  );
}
