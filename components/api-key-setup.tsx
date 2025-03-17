"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, Key } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function ApiKeySetup() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [showSetup, setShowSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      setError("Please enter a valid API key")
      return
    }

    try {
      // In a real application, you would store this securely
      // For this demo, we'll just show a success message
      localStorage.setItem("openai_api_key", apiKey)

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved for this session.",
      })

      setShowSetup(false)
      setApiKey("")
    } catch (error) {
      setError("Failed to save API key. Please try again.")
    }
  }

  if (!showSetup) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>AI Features Available</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Some features require an OpenAI API key. You can still use template-based generation without one.</span>
          <Button variant="outline" size="sm" onClick={() => setShowSetup(true)}>
            <Key className="mr-2 h-4 w-4" />
            Set API Key
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Set OpenAI API Key</CardTitle>
        <CardDescription>Your API key is stored locally in your browser and never sent to our servers.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            You can get an API key from the{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              OpenAI dashboard
            </a>
            .
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setShowSetup(false)}>
          Cancel
        </Button>
        <Button onClick={handleSaveKey}>Save API Key</Button>
      </CardFooter>
    </Card>
  )
}

