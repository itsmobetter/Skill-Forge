import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SOP } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { SOPEditor } from "./sop-editor";
import { CalendarIcon, FileText, Plus, SearchIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SOPListProps {
  onSelectSOP: (sop: SOP) => void;
  isAdmin?: boolean;
}

export function SOPList({ onSelectSOP, isAdmin = false }: SOPListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: sops, isLoading, error } = useQuery<SOP[]>({
    queryKey: ["/api/sop"],
  });

  const filteredSOPs = sops
    ? sops.filter(
        (sop) =>
          sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sop.objective.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateSuccess = () => {
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Create New SOP</CardTitle>
          <CardDescription>
            Create a new Standard Operating Procedure document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SOPEditor onSaveSuccess={handleCreateSuccess} />
          <div className="mt-4">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Standard Operating Procedures</CardTitle>
          {isAdmin && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create New
            </Button>
          )}
        </div>
        <CardDescription>
          Browse and select a Standard Operating Procedure to view
        </CardDescription>
        <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
          <Input
            type="text"
            placeholder="Search by title or objective..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
          <Button variant="outline" size="icon">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-240px)]">
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="py-4 text-center text-destructive">
              <p>Error loading SOPs: {error.message}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          ) : filteredSOPs.length === 0 ? (
            // Empty state
            <div className="py-8 text-center">
              {searchTerm ? (
                <p className="text-muted-foreground">
                  No SOPs match your search criteria. Try a different search term.
                </p>
              ) : (
                <div className="space-y-3">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No SOPs are available.</p>
                  {isAdmin && (
                    <Button onClick={() => setIsCreating(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Create Your First SOP
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            // SOPs list
            <div className="space-y-3">
              {filteredSOPs.map((sop) => (
                <Card
                  key={sop.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onSelectSOP(sop)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{sop.title}</CardTitle>
                    <div className="flex items-center justify-between mt-1">
                      <CardDescription className="line-clamp-1">
                        {sop.objective}
                      </CardDescription>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {formatDate(sop.updatedAt)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}