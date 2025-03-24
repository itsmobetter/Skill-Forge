import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// API configuration schema
const apiConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  apiKey: z.string().min(1, { message: "API key is required." }),
  endpoint: z.union([z.string(), z.null()]).optional().transform(e => e === "" ? null : e),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8192),
  useTranscriptions: z.boolean(),
  usePdf: z.boolean(),
  streaming: z.boolean(),
  useAdminApiKeyForAll: z.boolean(),
  allowUserApiConfig: z.boolean(),
  enableAdvancedFeatures: z.boolean(),
});

type ApiConfigFormValues = z.infer<typeof apiConfigSchema>;

export default function AdminApiConfigPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();
  
  // Fetch global API settings
  const { data: globalConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["/api/admin/settings/api"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings/api");
      return await res.json();
    }
  });

  // Form initialization
  const apiConfigForm = useForm<ApiConfigFormValues>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      provider: "Google AI",
      model: "gemini-1.5-flash",
      apiKey: "",
      endpoint: "",
      temperature: 0.7,
      maxTokens: 1024,
      useTranscriptions: true,
      usePdf: true,
      streaming: true,
      useAdminApiKeyForAll: true,
      allowUserApiConfig: false,
      enableAdvancedFeatures: true,
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (globalConfig) {
      apiConfigForm.reset({
        ...apiConfigForm.getValues(),
        ...globalConfig,
      });
    }
  }, [globalConfig, apiConfigForm]);

  // Update API configuration mutation
  const updateApiConfigMutation = useMutation({
    mutationFn: async (data: ApiConfigFormValues) => {
      const res = await apiRequest("PATCH", "/api/admin/settings/api", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "API configuration updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/api"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApiConfigFormValues) => {
    updateApiConfigMutation.mutate(data);
  };

  // Reset to default settings
  const resetApiConfig = () => {
    apiConfigForm.reset({
      provider: "Google AI",
      model: "gemini-1.5-flash",
      apiKey: apiConfigForm.getValues().apiKey, // Keep the current API key
      endpoint: "",
      temperature: 0.7,
      maxTokens: 1024,
      useTranscriptions: true,
      usePdf: true,
      streaming: true,
      useAdminApiKeyForAll: true,
      allowUserApiConfig: false,
      enableAdvancedFeatures: true,
    });
    toast({
      title: "Reset",
      description: "API configuration reset to defaults",
      variant: "default",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">API Configuration</h1>
          <p className="text-slate-500 mt-1">
            Configure the AI assistant settings for the application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Global API Settings</CardTitle>
            <CardDescription>
              These settings control how the AI assistant behaves across the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingConfig ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...apiConfigForm}>
                <form onSubmit={apiConfigForm.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={apiConfigForm.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="OpenAI">OpenAI</SelectItem>
                              <SelectItem value="Groq">Groq</SelectItem>
                              <SelectItem value="Anthropic">Anthropic</SelectItem>
                              <SelectItem value="Google AI">Google AI</SelectItem>
                              <SelectItem value="Local (Ollama)">Local (Ollama)</SelectItem>
                              <SelectItem value="Custom API Endpoint">Custom API Endpoint</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                              <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                              <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                              <SelectItem value="claude-3-opus">claude-3-opus</SelectItem>
                              <SelectItem value="claude-3-sonnet">claude-3-sonnet</SelectItem>
                              <SelectItem value="llama3-70b">llama3-70b</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={apiConfigForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input 
                              type={showApiKey ? "text" : "password"} 
                              placeholder="Enter API key" 
                              {...field} 
                              className="rounded-r-none"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-l-none border-l-0"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormDescription>
                          Your API key for the selected provider. This is used for global system-wide functionality.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiConfigForm.control}
                    name="endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom API Endpoint (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://api.example.com/v1/chat/completions" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Only required for custom API endpoints or certain providers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={apiConfigForm.control}
                      name="temperature"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Temperature: {value.toFixed(1)}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={2}
                              step={0.1}
                              value={[value]}
                              onValueChange={(vals) => onChange(vals[0])}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Controls randomness: Lower values are more focused, higher values more creative.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="maxTokens"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Max Tokens: {value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={100}
                              max={8192}
                              step={100}
                              value={[value]}
                              onValueChange={(vals) => onChange(vals[0])}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of tokens the model will generate.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={apiConfigForm.control}
                      name="useTranscriptions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use Transcriptions</FormLabel>
                            <FormDescription>
                              Use video transcriptions for AI context
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="usePdf"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use PDF Support</FormLabel>
                            <FormDescription>
                              Enable PDF processing in AI assistant
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="streaming"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Streaming</FormLabel>
                            <FormDescription>
                              Stream AI responses in real-time
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-medium">User Permissions</h3>
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="useAdminApiKeyForAll"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use Admin API Key For All Users</FormLabel>
                            <FormDescription>
                              When enabled, all users will use the admin-configured API key
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="allowUserApiConfig"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow User API Configuration</FormLabel>
                            <FormDescription>
                              When enabled, users can configure their own API keys and settings
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={apiConfigForm.control}
                      name="enableAdvancedFeatures"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Advanced Features</FormLabel>
                            <FormDescription>
                              When enabled, all advanced AI features are available to users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetApiConfig}
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateApiConfigMutation.isPending}
                    >
                      {updateApiConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Configuration"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}