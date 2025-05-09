import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  ChevronRight,
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = insertUserSchema
  .extend({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// Removed AnimatedNodes component for minimalist design

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
      {/* Minimalist light background */}
      <div className="absolute inset-0 bg-slate-50 z-0"></div>

      {/* Subtle pattern overlay - very light */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0xNSAyNWgxMHYxaC0xMHpNMTUgMTVoMTB2MWgtMTB6TTI1IDE1djEwaDFWMTV6TTE1IDE1djEwaDF2LTEweiIgZmlsbD0icmdiYSgwLDAsMCwwLjAyKSIvPjwvZz48L3N2Zz4=')] opacity-5 z-0"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center p-4 z-10">
        <div className="hidden md:flex md:col-span-3 flex-col text-slate-800 p-8 relative">
          {/* Simple accents - minimal */}
          <div className="absolute -top-20 -left-20 w-32 h-32 bg-primary/5 rounded-full"></div>
          <div className="absolute bottom-20 -right-20 w-36 h-36 bg-primary/5 rounded-full"></div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-extrabold text-slate-800">
                Skill Forge
              </h1>
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-4">
              AI-Powered Manufacturing <br />
              Excellence Platform
            </h2>
            <p className="text-xl text-slate-600 mb-10 max-w-xl">
              Intelligent training solutions for manufacturing professionals
              with integrated SOPs, quality control metrics, and AI-enhanced
              learning.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <Factory className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Smart Manufacturing</h3>
                </div>
                <p className="text-slate-600">
                  AI-driven quality control and statistical process optimization
                  training modules.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">AI Assistant</h3>
                </div>
                <p className="text-slate-600">
                  Contextual AI support for complex manufacturing procedures and
                  technical questions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Predictive Analytics
                  </h3>
                </div>
                <p className="text-slate-600">
                  Learn how to implement predictive maintenance systems using
                  machine learning models.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Digital Twin</h3>
                </div>
                <p className="text-slate-600">
                  Training on implementing digital twin technology for real-time
                  process monitoring.
                </p>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              <span>
                Trusted by leading manufacturing companies worldwide. Developed
                and contributed by Group 3 for TIE3100 Systems Design Project
              </span>
            </div>
          </div>
        </div>

        <Card className="w-full md:col-span-2 shadow-md bg-white border-slate-100">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-2 md:hidden">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              Skill Forge
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Access your AI-powered manufacturing training
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-700 hover:text-slate-900"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-700 hover:text-slate-900"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600">
                            Username or Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username or email"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
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
                          <FormLabel className="text-slate-600">
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor="remember-me"
                          className="text-sm text-slate-600"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 text-sm text-primary"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <span className="flex items-center">
                          Sign In <ChevronRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600">
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
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
                          <FormLabel className="text-slate-600">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
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
                          <FormLabel className="text-slate-600">
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
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
                          <FormLabel className="text-slate-600">
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <span className="flex items-center">
                          Create Account{" "}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </span>
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
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {activeTab === "login"
                    ? "New to Skill Forge?"
                    : "Already have an account?"}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-800 bg-transparent hover:bg-white/10 hover:text-slate-800"
              onClick={() =>
                setActiveTab(activeTab === "login" ? "register" : "login")
              }
            >
              {activeTab === "login" ? "Create an account" : "Sign in instead"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}