import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  position: z.string().optional(),
  department: z.string().optional(),
  about: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// API configuration schema
const apiConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  apiKey: z.string().min(1, { message: "API key is required." }),
  endpoint: z.string().optional(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(4096),
  useTranscriptions: z.boolean(),
  usePdf: z.boolean(),
  streaming: z.boolean(),
});

type ApiConfigFormValues = z.infer<typeof apiConfigSchema>;

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Fetch API configuration
  const { data: apiConfig, isLoading: isLoadingApiConfig } = useQuery({
    queryKey: ["/api/user/settings/api"],
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
      position: profile?.position || "",
      department: profile?.department || "",
      about: profile?.about || "",
    },
    values: profile
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // API configuration form
  const apiConfigForm = useForm<ApiConfigFormValues>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      provider: apiConfig?.provider || "OpenAI",
      model: apiConfig?.model || "gpt-4o",
      apiKey: apiConfig?.apiKey || "",
      endpoint: apiConfig?.endpoint || "",
      temperature: apiConfig?.temperature || 0.7,
      maxTokens: apiConfig?.maxTokens || 1024,
      useTranscriptions: apiConfig?.useTranscriptions ?? true,
      usePdf: apiConfig?.usePdf ?? true,
      streaming: apiConfig?.streaming ?? true,
    },
    values: apiConfig
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update API config mutation
  const updateApiConfigMutation = useMutation({
    mutationFn: async (data: ApiConfigFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/settings/api", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings/api"] });
      toast({
        title: "API configuration updated",
        description: "Your API configuration has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update API configuration",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  // Handle API config form submission
  const onApiConfigSubmit = (data: ApiConfigFormValues) => {
    updateApiConfigMutation.mutate(data);
  };

  // Reset API config to defaults
  const resetApiConfig = () => {
    apiConfigForm.reset({
      provider: "OpenAI",
      model: "gpt-4o",
      apiKey: apiConfig?.apiKey || "", // Keep the API key
      endpoint: "",
      temperature: 0.7,
      maxTokens: 1024,
      useTranscriptions: true,
      usePdf: true,
      streaming: true,
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
              <p className="text-slate-500">Manage your account and application preferences</p>
            </div>
            
            <Card className="overflow-hidden mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-slate-200">
                  <TabsList className="ml-4 mb-0 bg-transparent border-0">
                    <TabsTrigger 
                      value="profile" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none"
                    >
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="password" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none"
                    >
                      Password
                    </TabsTrigger>
                    <TabsTrigger 
                      value="api" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none"
                    >
                      API Configuration
                    </TabsTrigger>
                    {user?.isAdmin && (
                      <TabsTrigger 
                        value="users" 
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none"
                      >
                        User Management
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
                
                <TabsContent value="profile" className="p-6">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium text-slate-900">Profile Information</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Update your account information and profile picture.
                      </p>
                    </div>
                    
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      {isLoadingProfile ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                        </div>
                      ) : (
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your first name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your last name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email address</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="Enter your email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Position</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your position" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a department" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Engineering">Engineering</SelectItem>
                                      <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                                      <SelectItem value="Production">Production</SelectItem>
                                      <SelectItem value="R&D">R&D</SelectItem>
                                      <SelectItem value="Management">Management</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="about"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>About</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Brief description about your role and experience" 
                                      className="resize-none" 
                                      rows={3}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Brief description about your role and experience.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div>
                              <Label className="block text-sm font-medium text-slate-700">Photo</Label>
                              <div className="mt-1 flex items-center">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={profile?.avatarUrl} alt={user?.username} />
                                  <AvatarFallback>{`${profile?.firstName?.charAt(0) || ""}${profile?.lastName?.charAt(0) || ""}`}</AvatarFallback>
                                </Avatar>
                                <Button type="button" variant="outline" size="sm" className="ml-5">
                                  Change
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => profileForm.reset()}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="password" className="p-6">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium text-slate-900">Change Password</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Update your password to maintain account security.
                      </p>
                    </div>
                    
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter current password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter new password" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Must be at least 6 characters.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirm new password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={updatePasswordMutation.isPending}
                            >
                              {updatePasswordMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="api" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">LLM API Configuration</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Configure the AI assistant API settings for the application.
                      </p>
                    </div>
                    
                    {isLoadingApiConfig ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                      </div>
                    ) : (
                      <Form {...apiConfigForm}>
                        <form onSubmit={apiConfigForm.handleSubmit(onApiConfigSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <FormField
                              control={apiConfigForm.control}
                              name="provider"
                              render={({ field }) => (
                                <FormItem className="col-span-full">
                                  <FormLabel>API Provider</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select API provider" />
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
                                <FormItem className="col-span-full">
                                  <FormLabel>Model</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
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
                            
                            <FormField
                              control={apiConfigForm.control}
                              name="apiKey"
                              render={({ field }) => (
                                <FormItem className="col-span-full">
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={apiConfigForm.control}
                              name="endpoint"
                              render={({ field }) => (
                                <FormItem className="col-span-full">
                                  <FormLabel>Custom API Endpoint (optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://api.example.com/v1/chat/completions" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
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
                                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>More Precise (0)</span>
                                    <span>More Creative (2)</span>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={apiConfigForm.control}
                              name="maxTokens"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Tokens</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} max={4096} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="col-span-full">
                              <FormLabel className="text-sm font-medium text-slate-700">Advanced Settings</FormLabel>
                              <div className="mt-2 space-y-3">
                                <FormField
                                  control={apiConfigForm.control}
                                  name="useTranscriptions"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Use video transcriptions as context</FormLabel>
                                        <FormDescription>
                                          Include video transcriptions in the AI context for more relevant responses
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={apiConfigForm.control}
                                  name="usePdf"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Use PDF documents as context</FormLabel>
                                        <FormDescription>
                                          Include PDF content in the AI context for comprehensive responses
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={apiConfigForm.control}
                                  name="streaming"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Enable response streaming</FormLabel>
                                        <FormDescription>
                                          Show AI responses as they are generated instead of waiting for completion
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
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
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
