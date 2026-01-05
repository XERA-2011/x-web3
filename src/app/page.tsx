import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <header className="mb-12 border-b border-gray-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">x2011</h1>
          <p className="text-gray-400">Experimental WebGL Visualizations</p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/viz/lantern" className="group relative block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20">
          <div className="h-48 bg-gradient-to-br from-gray-800 to-black overflow-hidden relative">
            {/* Thumbnail Placeholder - could reuse lantern logo or screenshot if available */}
            <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-500">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 blur-xl group-hover:bg-orange-500/40 transition-all"></div>
            </div>
            <img
              src="/viz/lantern/res/img/intro/logo-400.png"
              alt="Lantern Logo"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-auto opacity-80 group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
            />
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Lantern</h2>
            <p className="text-gray-400 text-sm line-clamp-2">
              A realtime music visualizer originally by UberViz.
              Featuring audio-reactive particles, ripples, and post-processing effects.
              Ported to React/Three.js.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">Three.js</span>
              <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">React</span>
              <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">WebGL</span>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
