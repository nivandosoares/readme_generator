"use client"

import { useState } from "react"
import { RepoSearch } from "./repo-search"
import { RepoList } from "./repo-list"
import { ReadmeViewer } from "./readme-viewer"
import { UserProfileViewer } from "./user-profile-viewer"
import { AIInsights } from "./ai-insights"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Repository } from "@/lib/types"
import { FileText, User, LineChart } from "lucide-react"

export function RepoExplorer() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [readme, setReadme] = useState<string | null>(null)
  const [generatingReadme, setGeneratingReadme] = useState(false)
  const [activeTab, setActiveTab] = useState("repositories")
  const [mainTab, setMainTab] = useState("repo-readme")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleMainTabChange = (value: string) => {
    setMainTab(value)
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GitHub Tools</h2>
        <p className="text-muted-foreground">Generate READMEs and get insights for GitHub repositories and profiles.</p>
      </div>

      <Tabs value={mainTab} onValueChange={handleMainTabChange} className="max-w-3xl mx-auto">
        <TabsList>
          <TabsTrigger value="repo-readme">
            <FileText className="mr-2 h-4 w-4" />
            Repository README
          </TabsTrigger>
          <TabsTrigger value="profile-readme">
            <User className="mr-2 h-4 w-4" />
            Profile README
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repo-readme" className="mt-4 space-y-6">
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
                {selectedRepo && (
                  <TabsTrigger value="ai-insights">
                    <LineChart className="mr-2 h-4 w-4" />
                    Repository Insights
                  </TabsTrigger>
                )}
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
              {selectedRepo && (
                <TabsContent value="ai-insights" className="mt-4">
                  <AIInsights repo={selectedRepo} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="profile-readme" className="mt-4">
          <UserProfileViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

