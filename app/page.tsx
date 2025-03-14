
import { Header } from "@/components/header";
import { RepoExplorer } from "@/components/repo-explorer";

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
              GitHub README Generator
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Create beautiful and professional README files for your GitHub repositories in seconds.
            </p>
          </div>

          {/* Repo Explorer */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
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
              href="https://github.com/your-username"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Your Name
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

