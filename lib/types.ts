export interface Repository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  html_url: string
  description: string | null
  fork: boolean
  url: string
  created_at: string
  updated_at: string
  pushed_at: string
  homepage: string | null
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  forks_count: number
  open_issues_count: number
  license: {
    key: string
    name: string
    url: string
  } | null
  topics: string[]
  visibility: string
  default_branch: string
  private: boolean
}

export interface UserProfile {
  login: string
  id: number
  avatar_url: string
  html_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  twitter_username: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface LanguageStats {
  [language: string]: number
}

export interface UserAnalysis {
  username: string
  name: string | null
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  twitter: string | null
  email: string | null
  followers: number
  following: number
  totalStars: number
  totalForks: number
  totalRepos: number
  topLanguages: LanguageStats
  topTopics: string[]
  featuredRepos: Repository[]
  recentActivity: Repository[]
}

