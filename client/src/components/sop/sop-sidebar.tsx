import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import {
  FileText,
  BookOpen,
  Cog,
  PlusCircle,
  List,
  PenTool,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { SOP } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SOPSidebar() {
  const { user } = useAuth();
  const [isSOPListMatch] = useRoute("/sop");
  const [isSOPCreateMatch] = useRoute("/sop/create");
  const [isSOPDetailsMatch, params] = useRoute("/sop/:id");
  const [isSOPEditMatch, editParams] = useRoute("/sop/:id/edit");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.isAdmin || false;

  const { data: sops, isLoading } = useQuery<SOP[]>({
    queryKey: ["/api/sop"],
    enabled: isAdmin,
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "group border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[60px]" : "w-[280px]"
    )}>
      <div className="flex h-14 items-center border-b px-4 justify-between">
        {!isCollapsed && (
          <div className="flex space-x-2">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 h-9 justify-start">
                <ChevronLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            <Link href="/sop">
              <Button variant="ghost" className="flex items-center gap-2 h-9 justify-start">
                <BookMarked className="h-5 w-5" />
                <span className="font-semibold">SOPs</span>
              </Button>
            </Link>
          </div>
        )}
        {isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon" className="h-9 w-9 mb-1">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Back to Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn("pt-4 pb-8", isCollapsed ? "px-2" : "px-4")}>
          <div className="mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/sop">
                    <Button
                      variant={isSOPListMatch ? "secondary" : "ghost"}
                      className={cn(
                        "flex items-center gap-2 h-9",
                        isCollapsed ? "justify-center w-full px-0" : "justify-start w-full"
                      )}
                    >
                      <List className="h-5 w-5" />
                      {!isCollapsed && <span>All SOPs</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">All SOPs</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/sop/create">
                      <Button
                        variant={isSOPCreateMatch ? "secondary" : "ghost"}
                        className={cn(
                          "flex items-center gap-2 h-9",
                          isCollapsed ? "justify-center w-full px-0" : "justify-start w-full"
                        )}
                      >
                        <PlusCircle className="h-5 w-5" />
                        {!isCollapsed && <span>Create New SOP</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">Create New SOP</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {isAdmin && !isLoading && sops && sops.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  SOP Documents
                </h3>
              )}
              {sops.map((sop) => (
                <TooltipProvider key={sop.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={`/sop/${sop.id}`}>
                        <Button
                          variant={
                            (isSOPDetailsMatch && params?.id === sop.id) ||
                            (isSOPEditMatch && editParams?.id === sop.id)
                              ? "secondary"
                              : "ghost"
                          }
                          className={cn(
                            "flex items-center gap-2 h-9",
                            isCollapsed ? "justify-center w-full px-0" : "justify-start w-full text-left"
                          )}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          {!isCollapsed && <span className="truncate">{sop.title}</span>}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{sop.title}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          <div className={cn("border-t", isCollapsed ? "mt-4 pt-4" : "mt-4 pt-4")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/courses">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 h-9",
                        isCollapsed ? "justify-center w-full px-0" : "justify-start w-full"
                      )}
                    >
                      <BookOpen className="h-5 w-5" />
                      {!isCollapsed && <span>Course Library</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Course Library</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/dashboard">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 h-9",
                        isCollapsed ? "justify-center w-full px-0" : "justify-start w-full"
                      )}
                    >
                      <Cog className="h-5 w-5" />
                      {!isCollapsed && <span>Dashboard</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Dashboard</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}