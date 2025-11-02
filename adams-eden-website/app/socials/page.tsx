export default function SocialsComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌱</span>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Propagating...
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300">
            Check back for new content!
          </p>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-4">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            We&apos;re growing something special here. 🌿
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Plantbook is currently under development as we cultivate the perfect social gardening experience. 
            Our team is working hard to bring you features for connecting with fellow gardeners, sharing your 
            growing journey, and building a thriving community.
          </p>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              In the meantime, explore our other features:
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <a
                href="/planner"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                🌱 Garden Planner
              </a>
              <a
                href="/tracker"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                📊 Plant Tracker
              </a>
              <a
                href="/calendar"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                📅 Calendar
              </a>
              <a
                href="/journal"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                📔 Journal
              </a>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Stay tuned for updates! 🚀
        </p>
      </div>
    </div>
  )
}
