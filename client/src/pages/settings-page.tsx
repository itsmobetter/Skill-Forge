import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, Edit, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

// New user schema
const newUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  isAdmin: z.boolean().default(false),
  department: z.string().optional(),
  position: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // New user form
  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      isAdmin: false,
      department: "Quality Assurance",
      position: "",
    },
  });

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Fetch API configuration
  const { data: apiConfig, isLoading: isLoadingApiConfig } = useQuery({
    queryKey: ["/api/user/settings/api"],
  });
  
  // Fetch all users (admin only)
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin === true,
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
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserFormValues) => {
      // Remove confirmPassword as it's not needed for API
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      setIsAddUserModalOpen(false);
      newUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User created",
        description: "The user has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
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
  
  // Handle new user form submission
  const onNewUserSubmit = (data: NewUserFormValues) => {
    createUserMutation.mutate(data);
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
    <DashboardLayout>
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
                
                {user?.isAdmin && (
                  <TabsContent value="users" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900">User Management</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Manage user accounts and permissions in the system.
                        </p>
                      </div>
                      
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                          <h4 className="text-base font-medium text-gray-900">All Users</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setIsAddUserModalOpen(true)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Department
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {isLoadingUsers ? (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600" />
                                  </td>
                                </tr>
                              ) : allUsers && allUsers.length > 0 ? (
                                allUsers.map((userData) => {
                                  // Find associated profile if available
                                  const userProfile = userData.profile;
                                  const initials = userProfile?.firstName && userProfile?.lastName 
                                    ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`
                                    : userData.username.substring(0, 2).toUpperCase();
                                  
                                  return (
                                    <tr key={userData.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-10 w-10">
                                            <Avatar>
                                              <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                          </div>
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{userProfile?.firstName} {userProfile?.lastName}</div>
                                            <div className="text-sm text-gray-500">{userProfile?.email || `@${userData.username}`}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          userData.isAdmin 
                                            ? "bg-primary-100 text-primary-800" 
                                            : "bg-gray-100 text-gray-800"
                                        }`}>
                                          {userData.isAdmin ? "Admin" : "User"}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {userProfile?.department || "—"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          Active
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm">
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No users found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-4 border-b">
                          <h4 className="text-base font-medium text-gray-900">Global API Settings</h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Configure API settings that will apply to all users in the system.
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between py-3 border-b">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Use admin API key for all users</h5>
                              <p className="text-xs text-gray-500">
                                When enabled, all users will use the admin's API configuration.
                              </p>
                            </div>
                            <Switch 
                              checked={true} 
                              onCheckedChange={() => {}}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between py-3 border-b">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Allow users to configure their own API</h5>
                              <p className="text-xs text-gray-500">
                                When enabled, users can set their own API configuration.
                              </p>
                            </div>
                            <Switch 
                              checked={false} 
                              onCheckedChange={() => {}}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between py-3">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Enable advanced LLM features</h5>
                              <p className="text-xs text-gray-500">
                                Enables PDF analysis and longer context.
                              </p>
                            </div>
                            <Switch 
                              checked={true} 
                              onCheckedChange={() => {}}
                            />
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                          <Button size="sm">
                            Save Global Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </Card>
          </div>
      
      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the specified details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newUserForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newUserForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newUserForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newUserForm.control}
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
                control={newUserForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter position" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Admin User</FormLabel>
                      <FormDescription>
                        Make this user an administrator with full system access.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
