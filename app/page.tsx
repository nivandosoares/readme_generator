import { Header } from "@/components/header"
import { RepoExplorer } from "@/components/repo-explorer"
import { ArrowRight, Info } from "lucide-react" // Import ArrowRight and Info icons

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Stop Procrastinating on READMEs
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              We know you'd rather code than write docs. Let us handle the boring part—generate a professional README in
              seconds.
            </p>

            {/* GitHub Token Info */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <p>✨NEW! Add a GitHub token to increase API rate limits from 60 to 5,000 requests per hour.✨</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <p>✨NEW! Search refined by repository direct link.✨</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <p>✨NEW! Generate a yourself introduction by a resume of your activities!.✨</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <p>Add a GitHub token to increase API rate limits from 60 to 5,000 requests per hour.</p>
            </div>

            <div className="mt-8">
              <a
                href="#repo-explorer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Generate Your README Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
            {/* Fun Visual Element (No Image) */}
            <div className="mt-12 flex justify-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            {/* Testimonial */}
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>
                "I used to spend hours writing READMEs. Now I just generate them in seconds. Lifesaver!" –{" "}
                <span className="font-semibold">@LazyDev123</span>
              </p>
            </div>
          </div>

          {/* Repo Explorer */}
          <div
            id="repo-explorer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <RepoExplorer />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            GitHub README Generator &copy; {new Date().getFullYear()} | Made with ❤️ by{" "}
            <a
              href="https://github.com/nivandosoares"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Nivando Soares
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

