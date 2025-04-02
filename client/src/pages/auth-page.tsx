import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { 
  Brain, 
  Loader2, 
  Bot, 
  Factory, 
  Cog, 
  Settings, 
  LineChart, 
  ShieldCheck, 
  BarChart4, 
  Cpu, 
  ChevronRight 
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Animation component to simulate AI-generated nodes
const AnimatedNodes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[10%] left-[20%] w-12 h-12 bg-primary/10 rounded-full animate-pulse"></div>
      <div className="absolute top-[20%] left-[60%] w-8 h-8 bg-primary/20 rounded-full animate-pulse [animation-delay:1s]"></div>
      <div className="absolute top-[30%] left-[30%] w-10 h-10 bg-primary/15 rounded-full animate-pulse [animation-delay:2s]"></div>
      <div className="absolute top-[50%] left-[70%] w-14 h-14 bg-primary/20 rounded-full animate-pulse [animation-delay:0.5s]"></div>
      <div className="absolute top-[70%] left-[40%] w-16 h-16 bg-primary/10 rounded-full animate-pulse [animation-delay:1.5s]"></div>
      <div className="absolute top-[80%] left-[80%] w-6 h-6 bg-primary/25 rounded-full animate-pulse [animation-delay:0.7s]"></div>
      
      {/* Connection lines */}
      <div className="absolute top-[15%] left-[25%] w-[30%] h-[1px] bg-gradient-to-r from-primary/30 to-transparent transform rotate-12"></div>
      <div className="absolute top-[35%] left-[35%] w-[25%] h-[1px] bg-gradient-to-r from-primary/30 to-transparent transform -rotate-6"></div>
      <div className="absolute top-[55%] left-[40%] w-[35%] h-[1px] bg-gradient-to-r from-primary/30 to-transparent transform rotate-12"></div>
      <div className="absolute top-[75%] left-[50%] w-[30%] h-[1px] bg-gradient-to-r from-primary/30 to-transparent transform -rotate-6"></div>
    </div>
  );
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background with manufacturing theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-primary/30 z-0"></div>
      
      {/* Circuit board pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0xNSAyNWgxMHYxaC0xMHpNMTUgMTVoMTB2MWgtMTB6TTI1IDE1djEwaDFWMTV6TTE1IDE1djEwaDF2LTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvZz48L3N2Zz4=')] opacity-10 z-0"></div>
      
      {/* Animated neural network nodes */}
      <AnimatedNodes />

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center p-4 z-10">
        <div className="hidden md:flex md:col-span-3 flex-col text-white p-8 relative">
          {/* Blob decoration */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
              <h1 className="text-4xl font-extrabold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">LearningPro</span>
              </h1>
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              AI-Powered Manufacturing <br />Excellence Platform
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-xl">
              Intelligent training solutions for manufacturing professionals with integrated SOPs, quality control metrics, and AI-enhanced learning.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Factory className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Smart Manufacturing</h3>
                </div>
                <p className="text-slate-300">AI-driven quality control and statistical process optimization training modules.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Assistant</h3>
                </div>
                <p className="text-slate-300">Contextual AI support for complex manufacturing procedures and technical questions.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Predictive Analytics</h3>
                </div>
                <p className="text-slate-300">Learn how to implement predictive maintenance systems using machine learning models.</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Digital Twin</h3>
                </div>
                <p className="text-slate-300">Training on implementing digital twin technology for real-time process monitoring.</p>
              </div>
            </div>
            
            <div className="mt-10 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Trusted by leading manufacturing companies worldwide</span>
            </div>
          </div>
        </div>

        <Card className="w-full md:col-span-2 shadow-2xl bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-2 md:hidden">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">LearningPro</span>
            </CardTitle>
            <CardDescription className="text-center text-slate-300">Access your AI-powered manufacturing training</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-300 hover:text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-300 hover:text-white">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Username or Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username or email" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me" className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                        <Label htmlFor="remember-me" className="text-sm text-slate-300">Remember me</Label>
                      </div>
                      <Button variant="link" className="p-0 text-sm text-primary">Forgot password?</Button>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <span className="flex items-center">Sign In <ChevronRight className="ml-2 h-4 w-4" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" 
                              className="border-white/20 bg-white/10 text-white placeholder:text-slate-400" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <span className="flex items-center">Create Account <ChevronRight className="ml-2 h-4 w-4" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col pt-0">
            <div className="relative w-full mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 backdrop-blur-sm bg-white/5 text-slate-300">
                  {activeTab === 'login' ? 'New to LearningPro?' : 'Already have an account?'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
            >
              {activeTab === 'login' ? 'Create an account' : 'Sign in instead'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
