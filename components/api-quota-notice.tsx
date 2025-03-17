"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Key } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function ApiQuotaNotice() {
  const { toast } = useToast()
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)
  const [apiKey, setApiKey] = useState("")

  const handleSaveApiKey = () => {
    if (!apiKey.trim() || !apiKey.startsWith("sk-")) {
      toast({
        variant: "destructive",
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key starting with 'sk-'",
      })
      return
    }

    // In a real application, you would store this securely
    // For this demo, we'll just show a success message
    localStorage.setItem("openai_api_key", apiKey)

    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved. Please refresh the page to use it.",
    })

    setShowApiKeyForm(false)
  }

  if (showApiKeyForm) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Your OpenAI API Key</CardTitle>
          <CardDescription>
            Your API key will be stored locally in your browser and never sent to our servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowApiKeyForm(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveApiKey}>Save API Key</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertTitle>AI Features Limited</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>Some AI-powered features are currently using template-based generation due to API quota limitations.</p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowApiKeyForm(true)}>
            <Key className="mr-2 h-4 w-4" />
            Use Your OpenAI API Key
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

