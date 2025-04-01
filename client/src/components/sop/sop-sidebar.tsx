import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { SOP } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export function SOPSidebar() {
  const { user } = useAuth();
  const [isSOPListMatch] = useRoute("/sop");
  const [isSOPCreateMatch] = useRoute("/sop/create");
  const [isSOPDetailsMatch, params] = useRoute("/sop/:id");
  const [isSOPEditMatch, editParams] = useRoute("/sop/:id/edit");

  const isAdmin = user?.isAdmin || false;

  const { data: sops, isLoading } = useQuery<SOP[]>({
    queryKey: ["/api/sop"],
    enabled: isAdmin,
  });

  return (
    <div className="group w-[280px] shrink-0 border-r bg-muted/40 flex flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/sop">
          <Button variant="ghost" className="flex items-center gap-2 h-9 w-full justify-start">
            <BookMarked className="h-5 w-5" />
            <span className="font-semibold">Standard Operating Procedures</span>
          </Button>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 pt-4 pb-8">
          <div className="mb-2">
            <Link to="/sop">
              <Button
                variant={isSOPListMatch ? "secondary" : "ghost"}
                className="flex items-center justify-start w-full gap-2 h-9"
              >
                <List className="h-5 w-5" />
                <span>All SOPs</span>
              </Button>
            </Link>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <Link to="/sop/create">
                <Button
                  variant={isSOPCreateMatch ? "secondary" : "ghost"}
                  className="flex items-center justify-start w-full gap-2 h-9"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Create New SOP</span>
                </Button>
              </Link>
            </div>
          )}

          {isAdmin && !isLoading && sops && sops.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                SOP Documents
              </h3>
              {sops.map((sop) => (
                <Link to={`/sop/${sop.id}`} key={sop.id}>
                  <Button
                    variant={
                      (isSOPDetailsMatch && params?.id === sop.id) ||
                      (isSOPEditMatch && editParams?.id === sop.id)
                        ? "secondary"
                        : "ghost"
                    }
                    className="flex items-center justify-start w-full text-left h-9 gap-2"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{sop.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link to="/courses">
              <Button
                variant="ghost"
                className="flex items-center justify-start w-full gap-2 h-9"
              >
                <BookOpen className="h-5 w-5" />
                <span>Course Library</span>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="ghost"
                className="flex items-center justify-start w-full gap-2 h-9"
              >
                <Cog className="h-5 w-5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}