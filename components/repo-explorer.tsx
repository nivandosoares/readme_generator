"use client"

import { useState } from "react"
import { RepoSearch } from "./repo-search"
import { RepoList } from "./repo-list"
import { ReadmeViewer } from "./readme-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Repository } from "@/lib/types"

export function RepoExplorer() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [readme, setReadme] = useState<string | null>(null)
  const [generatingReadme, setGeneratingReadme] = useState(false)
  const [activeTab, setActiveTab] = useState("repositories")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Generate README Files</h2>
        <p className="text-muted-foreground">Search for a GitHub repository to generate a README file.</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <RepoSearch
          setRepos={setRepos}
          setLoading={setLoading}
          setError={setError}
          setSelectedRepo={setSelectedRepo}
          setReadme={setReadme}
        />
      </div>

      {repos.length > 0 && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-3xl mx-auto">
          <TabsList>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            {readme && <TabsTrigger value="readme">Generated README</TabsTrigger>}
          </TabsList>
          <TabsContent value="repositories" className="mt-4">
            <RepoList
              repos={repos}
              loading={loading}
              selectedRepo={selectedRepo}
              setSelectedRepo={setSelectedRepo}
              setReadme={setReadme}
              generatingReadme={generatingReadme}
              setGeneratingReadme={setGeneratingReadme}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          {readme && (
            <TabsContent value="readme" className="mt-4">
              <ReadmeViewer
                readme={readme}
                repoName={selectedRepo?.name || "repository"}
                repoOwner={selectedRepo?.owner.login || ""}
                repoBranch={selectedRepo?.default_branch || "main"}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}

