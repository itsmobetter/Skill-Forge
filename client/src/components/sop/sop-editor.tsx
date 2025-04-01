import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SOP } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const sopFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  objective: z.string().min(10, "Objective must be at least 10 characters long"),
  scope: z.string().min(10, "Scope must be at least 10 characters long"),
  responsibilities: z.array(
    z.object({
      role: z.string().min(1, "Role is required"),
      description: z.string().min(1, "Description is required")
    })
  ).min(1, "At least one responsibility is required"),
  procedure: z.array(
    z.object({
      step: z.string().min(1, "Step title is required"),
      description: z.string().min(1, "Step description is required")
    })
  ).min(1, "At least one procedure step is required"),
  references: z.array(
    z.object({
      title: z.string().min(1, "Reference title is required"),
      link: z.string().optional()
    })
  ).optional()
});

type SopFormValues = z.infer<typeof sopFormSchema>;

interface SOPEditorProps {
  existingSOP?: SOP;
  onSaveSuccess?: () => void;
  isDialog?: boolean;
}

export function SOPEditor({ existingSOP, onSaveSuccess, isDialog = false }: SOPEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const defaultValues: SopFormValues = {
    title: existingSOP?.title || "",
    objective: existingSOP?.objective || "",
    scope: existingSOP?.scope || "",
    responsibilities: existingSOP?.responsibilities 
      ? Array.isArray(existingSOP.responsibilities) 
        ? existingSOP.responsibilities 
        : Object.entries(existingSOP.responsibilities).map(([role, description]) => ({ role, description }))
      : [{ role: "", description: "" }],
    procedure: existingSOP?.procedure
      ? Array.isArray(existingSOP.procedure)
        ? existingSOP.procedure
        : Object.entries(existingSOP.procedure).map(([step, description]) => ({ step, description }))
      : [{ step: "", description: "" }],
    references: existingSOP?.references
      ? Array.isArray(existingSOP.references)
        ? existingSOP.references
        : Object.entries(existingSOP.references).map(([title, link]) => ({ title, link }))
      : [{ title: "", link: "" }]
  };

  const form = useForm<SopFormValues>({
    resolver: zodResolver(sopFormSchema),
    defaultValues
  });

  const sopMutation = useMutation({
    mutationFn: async (values: SopFormValues) => {
      // Convert the form arrays to objects for the API
      const responsibilities = {};
      values.responsibilities.forEach(item => {
        responsibilities[item.role] = item.description;
      });

      const procedure = {};
      values.procedure.forEach(item => {
        procedure[item.step] = item.description;
      });

      const references = {};
      if (values.references) {
        values.references.forEach(item => {
          references[item.title] = item.link || "";
        });
      }

      const sopData = {
        title: values.title,
        objective: values.objective,
        scope: values.scope,
        responsibilities,
        procedure,
        references
      };

      if (existingSOP) {
        const res = await apiRequest("PATCH", `/api/sop/${existingSOP.id}`, sopData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/sop", sopData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: existingSOP ? "SOP Updated" : "SOP Created",
        description: existingSOP
          ? "The standard operating procedure has been updated successfully."
          : "A new standard operating procedure has been created successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/sop"] });
      
      // Handle success callback
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      // Close dialog if in dialog mode
      if (isDialog) {
        setOpen(false);
      }

      // Reset form if creating a new SOP
      if (!existingSOP) {
        form.reset(defaultValues);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${existingSOP ? "update" : "create"} SOP: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SopFormValues) => {
    sopMutation.mutate(values);
  };

  const addResponsibility = () => {
    const currentResponsibilities = form.getValues("responsibilities") || [];
    form.setValue("responsibilities", [...currentResponsibilities, { role: "", description: "" }]);
  };

  const removeResponsibility = (index: number) => {
    const currentResponsibilities = form.getValues("responsibilities") || [];
    if (currentResponsibilities.length > 1) {
      form.setValue(
        "responsibilities",
        currentResponsibilities.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Cannot Remove",
        description: "At least one responsibility is required.",
        variant: "destructive",
      });
    }
  };

  const addProcedureStep = () => {
    const currentProcedure = form.getValues("procedure") || [];
    form.setValue("procedure", [...currentProcedure, { step: "", description: "" }]);
  };

  const removeProcedureStep = (index: number) => {
    const currentProcedure = form.getValues("procedure") || [];
    if (currentProcedure.length > 1) {
      form.setValue(
        "procedure",
        currentProcedure.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Cannot Remove",
        description: "At least one procedure step is required.",
        variant: "destructive",
      });
    }
  };

  const addReference = () => {
    const currentReferences = form.getValues("references") || [];
    form.setValue("references", [...currentReferences, { title: "", link: "" }]);
  };

  const removeReference = (index: number) => {
    const currentReferences = form.getValues("references") || [];
    form.setValue(
      "references",
      currentReferences.filter((_, i) => i !== index)
    );
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="SOP Title" {...field} />
              </FormControl>
              <FormDescription>
                A clear and descriptive title for the procedure
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objective</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the purpose of this SOP"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain why this procedure exists and what it aims to achieve
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Define the boundaries of this procedure"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Define when, where, and to whom this procedure applies
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Responsibilities</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addResponsibility}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Role
            </Button>
          </div>
          
          {form.watch("responsibilities")?.map((_, index) => (
            <div key={`responsibility-${index}`} className="grid gap-4 border p-4 rounded-lg relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeResponsibility(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <FormField
                control={form.control}
                name={`responsibilities.${index}.role`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Job title or position" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`responsibilities.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the responsibilities of this role" 
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Procedure Steps</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addProcedureStep}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Step
            </Button>
          </div>
          
          {form.watch("procedure")?.map((_, index) => (
            <div key={`procedure-${index}`} className="grid gap-4 border p-4 rounded-lg relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeProcedureStep(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <FormField
                control={form.control}
                name={`procedure.${index}.step`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step {index + 1}</FormLabel>
                    <FormControl>
                      <Input placeholder="Step title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`procedure.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed instructions for this step" 
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>References (Optional)</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addReference}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Reference
            </Button>
          </div>
          
          {form.watch("references")?.map((_, index) => (
            <div key={`reference-${index}`} className="grid gap-4 border p-4 rounded-lg relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeReference(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <FormField
                control={form.control}
                name={`references.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Document or reference title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`references.${index}.link`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL or reference identifier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          {isDialog && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sopMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={sopMutation.isPending}
          >
            {sopMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {existingSOP ? "Updating" : "Creating"}
              </>
            ) : (
              existingSOP ? "Update SOP" : "Create SOP"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            {existingSOP ? "Edit SOP" : "Create New SOP"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {existingSOP ? "Edit Standard Operating Procedure" : "Create Standard Operating Procedure"}
            </DialogTitle>
            <DialogDescription>
              {existingSOP 
                ? "Update the details of this standard operating procedure." 
                : "Create a new standard operating procedure with structured information."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
            {formContent}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {existingSOP ? "Edit Standard Operating Procedure" : "Create Standard Operating Procedure"}
        </CardTitle>
        <CardDescription>
          {existingSOP 
            ? "Update the details of this standard operating procedure." 
            : "Create a new standard operating procedure with structured information."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}