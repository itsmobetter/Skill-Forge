import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    }
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: NewUserFormValues) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User added successfully",
        variant: "default"
      });
      setAddUserDialogOpen(false);
      refetchUsers();
      newUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive"
      });
    }
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/toggle-admin`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User admin status updated successfully",
        variant: "default"
      });
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user admin status",
        variant: "destructive"
      });
    }
  });

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
      department: "",
      position: "",
    }
  });

  const onAddUserSubmit = (data: NewUserFormValues) => {
    addUserMutation.mutate(data);
  };
  
  const handleToggleAdmin = (userId: number) => {
    toggleAdminMutation.mutate(userId);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-slate-500 mt-1">
              Manage user accounts and their permissions
            </p>
          </div>
          <Button 
            onClick={() => setAddUserDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium">No users found</h3>
                <p className="mt-1 text-sm text-slate-500">Add users to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profile?.avatarUrl} alt={user.username} />
                              <AvatarFallback>
                                {user.profile?.firstName?.charAt(0) || ""}
                                {user.profile?.lastName?.charAt(0) || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.profile?.firstName} {user.profile?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.profile?.email || "—"}</TableCell>
                        <TableCell>{user.profile?.department || "—"}</TableCell>
                        <TableCell>{user.profile?.position || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "outline"}>
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id)}
                            disabled={toggleAdminMutation.isPending}
                          >
                            {user.isAdmin ? "Remove Admin" : "Make Admin"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Enter the details for the new user account.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...newUserForm}>
              <form onSubmit={newUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newUserForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
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
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newUserForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
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
                          <Input placeholder="Position" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={newUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            {...field} 
                            className="rounded-r-none"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-l-none border-l-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
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
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Confirm password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newUserForm.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Admin Privileges</FormLabel>
                        <FormDescription>
                          Grant administrative permissions to this user
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

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddUserDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addUserMutation.isPending}
                  >
                    {addUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add User"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}