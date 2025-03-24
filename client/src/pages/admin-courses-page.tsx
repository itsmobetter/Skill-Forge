import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, FileVideo, Upload, ImagePlus, Star } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().min(1, "Course image is required"),
  category: z.string().min(1, "Category is required"),
  level: z.string().min(1, "Level is required"),
  duration: z.string().min(1, "Duration is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  reviewCount: z.number().min(0, "Review count cannot be negative"),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
  price: z.number().optional(),
  featured: z.boolean().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const moduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  order: z.number().min(1, "Order must be at least 1"),
  duration: z.string().min(1, "Duration is required"),
  videoUrl: z.string().url("Please provide a valid URL for the video").optional(),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("courses");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch modules for selected course
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["/api/courses", selectedCourse, "modules"],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await fetch(`/api/courses/${selectedCourse}/modules`);
      if (!res.ok) throw new Error("Failed to fetch modules");
      return await res.json();
    },
    enabled: !!selectedCourse,
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const res = await apiRequest("POST", "/api/courses", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsAddCourseOpen(false);
      courseForm.reset();
      toast({
        title: "Course added",
        description: "The course has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add module mutation
  const addModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("POST", `/api/courses/${selectedCourse}/modules`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse, "modules"] });
      setIsAddModuleOpen(false);
      moduleForm.reset();
      toast({
        title: "Module added",
        description: "The module has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiRequest("DELETE", `/api/courses/${courseId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      if (selectedCourse) {
        setSelectedCourse(null);
      }
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Course form setup
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      category: "",
      level: "beginner",
      duration: "",
      rating: 5,
      reviewCount: 0,
      tag: "",
      tagColor: "",
      price: 0,
      featured: false,
    },
  });

  // Module form setup
  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      duration: "",
      videoUrl: "",
    },
  });

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      courseForm.setValue("imageUrl", result);
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onAddCourseSubmit = (data: CourseFormValues) => {
    addCourseMutation.mutate(data);
    setImagePreview(null);
  };

  const onAddModuleSubmit = (data: ModuleFormValues) => {
    if (!selectedCourse) {
      toast({
        title: "Error",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }
    addModuleMutation.mutate(data);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  const selectCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setActiveTab("modules");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage learning courses and modules
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                  <DialogDescription>
                    Create a new learning course. Fill out the information below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onAddCourseSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={courseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., ISO 9001 Quality Management" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Provide a detailed description of the course" 
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Image</FormLabel>
                              <div className="flex flex-col gap-4">
                                {imagePreview ? (
                                  <div className="relative w-full max-w-[300px] h-auto aspect-video overflow-hidden rounded-md border">
                                    <img src={imagePreview} alt="Course preview" className="object-cover w-full h-full" />
                                  </div>
                                ) : field.value ? (
                                  <div className="relative w-full max-w-[300px] h-auto aspect-video overflow-hidden rounded-md border">
                                    <img src={field.value} alt="Course preview" className="object-cover w-full h-full" />
                                  </div>
                                ) : null}
                                
                                <div className="flex gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={triggerFileInput} 
                                    className="flex items-center gap-2"
                                  >
                                    <ImagePlus className="h-4 w-4" />
                                    {field.value ? "Change Image" : "Upload Image"}
                                  </Button>
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                  />
                                  
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Or enter image URL: https://example.com/image.jpg" 
                                      className="flex-1"
                                    />
                                  </FormControl>
                                </div>
                              </div>
                              <FormDescription>
                                Upload an image (max 2MB) or provide a URL. Recommended size: 1280x720 pixels.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="iso">ISO Standards</SelectItem>
                                  <SelectItem value="quality">Quality Control</SelectItem>
                                  <SelectItem value="spc">Statistical Process Control</SelectItem>
                                  <SelectItem value="msa">Measurement System Analysis</SelectItem>
                                  <SelectItem value="rca">Root Cause Analysis</SelectItem>
                                  <SelectItem value="doe">Design of Experiments</SelectItem>
                                  <SelectItem value="fmea">FMEA</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="tag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tag (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., New, Beginner-Friendly" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={courseForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., 4 weeks" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating (1-5)</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    min={1}
                                    max={5}
                                  />
                                </FormControl>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`h-4 w-4 ${star <= field.value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <FormDescription>
                                Initial course rating (can be updated later)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={courseForm.control}
                          name="reviewCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  min={0}
                                />
                              </FormControl>
                              <FormDescription>
                                Initial number of reviews
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={addCourseMutation.isPending}
                      >
                        {addCourseMutation.isPending ? "Creating..." : "Create Course"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {selectedCourse && (
              <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Module</DialogTitle>
                    <DialogDescription>
                      Create a new module for the selected course.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...moduleForm}>
                    <form onSubmit={moduleForm.handleSubmit(onAddModuleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={moduleForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Introduction to ISO 9001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={moduleForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Provide a detailed description of the module" 
                                  className="min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={moduleForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Order</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    min={1}
                                  />
                                </FormControl>
                                <FormDescription>
                                  The display order of this module
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={moduleForm.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 45 minutes" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={moduleForm.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Video URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://www.youtube.com/embed/..." />
                              </FormControl>
                              <FormDescription>
                                YouTube embed URL for the module video
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={addModuleMutation.isPending}
                        >
                          {addModuleMutation.isPending ? "Creating..." : "Create Module"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${activeTab === "courses" ? "data-[state=active]" : ""}`} data-state={activeTab === "courses" ? "active" : "inactive"} data-value="courses" role="tab" onClick={() => setActiveTab("courses")}>Courses</div>
            <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${activeTab === "modules" ? "data-[state=active]" : ""}`} data-state={activeTab === "modules" ? "active" : "inactive"} data-value="modules" role="tab" onClick={() => selectedCourse && setActiveTab("modules")} aria-disabled={!selectedCourse}>Modules</div>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="rounded-lg border">
              <Table>
                <TableCaption>
                  {courses.length === 0
                    ? "No courses found. Create your first course by clicking the 'Add Course' button."
                    : "List of all available courses"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCourses ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading courses...</p>
                      </TableCell>
                    </TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p>No courses found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell className="capitalize">{course.level}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectCourse(course.id)}
                            >
                              <FileVideo className="h-4 w-4 mr-1" />
                              Modules
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Edit course functionality
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            {selectedCourse && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Course Modules
                    {courses.find((c: any) => c.id === selectedCourse) && (
                      <span className="ml-2 text-muted-foreground">
                        for {courses.find((c: any) => c.id === selectedCourse).title}
                      </span>
                    )}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
                    Back to Courses
                  </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableCaption>
                      {modules.length === 0
                        ? "No modules found. Create your first module by clicking the 'Add Module' button."
                        : "List of all modules for this course"}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingModules ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center">
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Loading modules...</p>
                          </TableCell>
                        </TableRow>
                      ) : modules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p>No modules found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...modules]
                          .sort((a: any, b: any) => a.order - b.order)
                          .map((module: any) => (
                            <TableRow key={module.id}>
                              <TableCell>{module.order}</TableCell>
                              <TableCell className="font-medium">{module.title}</TableCell>
                              <TableCell>{module.duration}</TableCell>
                              <TableCell>
                                {module.videoUrl ? (
                                  <span className="text-green-600 font-medium text-sm">Available</span>
                                ) : (
                                  <span className="text-amber-600 font-medium text-sm">Not set</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Edit module functionality
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Delete module functionality
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}