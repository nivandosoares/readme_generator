/**
 * Generates a user profile README using local processing
 */
export function createUserProfileReadme(analysis: any): string {
  // Get language badges
  const languageBadges = Object.keys(analysis.topLanguages)
    .slice(0, 5)
    .map(
      (lang) =>
        `![${lang}](https://img.shields.io/badge/-${encodeURIComponent(lang)}-blue?style=flat-square&logo=${lang.toLowerCase()})`,
    )
    .join(" ")

  return `# Hi there 👋, I'm ${analysis.name || analysis.username}

${analysis.bio || "A developer passionate about building software"}

## About Me

- 📍 ${analysis.location || "Earth"}
- 🏢 ${analysis.company || "Acme Corp"}

## 🔧 Technologies & Skills

${languageBadges}

## 📊 GitHub Stats

- 🔭 I’m currently working on [project]
- 🌱 I’m currently learning [skill]
- 👯 I’m looking to collaborate on [project]
- 🤔 I’m looking for help with [issue]
- 💬 Ask me about [topic]
- 😄 Pronouns: [pronouns]
- ⚡ Fun fact: [fun fact]

## 📝 Recent Activity

${analysis.recentActivity.map((repo: any) => `- Updated [${repo.name}](${repo.html_url}) on ${new Date(repo.updated_at).toLocaleDateString()}`).join("\n")}

---

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=${analysis.username}" alt="Profile views" />
</p>

*This profile README was generated with [GitHub README Generator](https://github.com/readme-generator)*
`
}

