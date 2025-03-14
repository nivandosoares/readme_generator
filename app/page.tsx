import { Header } from "@/components/header"
import { RepoExplorer } from "@/components/repo-explorer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <RepoExplorer />
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>GitHub README Generator &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}

