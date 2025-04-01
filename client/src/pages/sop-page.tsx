import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";
import { Loader2, PlusCircle } from "lucide-react";
import { SOP } from "@shared/schema";
import { SOPViewer, SOPEditor } from "@/components/sop";
import { SOPSidebar } from "@/components/sop/sop-sidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function SOPPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.isAdmin || false;
  
  // Route matching
  const [isListRoute] = useRoute("/sop");
  const [isCreateRoute] = useRoute("/sop/create");
  const [isViewRoute, params] = useRoute("/sop/:id");
  const [isEditRoute, editParams] = useRoute("/sop/:id/edit");
  
  const sopId = params?.id || editParams?.id;
  
  // Fetch SOP data if we have an ID
  const { data: sop, isLoading: sopLoading } = useQuery<SOP>({
    queryKey: [`/api/sop/${sopId}`],
    enabled: !!sopId,
  });
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const renderContent = () => {
    if (isListRoute) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
            {isAdmin && (
              <Button className="flex items-center gap-2" asChild>
                <a href="/sop/create">
                  <PlusCircle className="h-4 w-4" />
                  Create New SOP
                </a>
              </Button>
            )}
          </div>
          
          {/* SOP list will be rendered by the sidebar */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Please select a standard operating procedure from the sidebar to view its details.
            </p>
          </div>
        </div>
      );
    }
    
    if (isCreateRoute && isAdmin) {
      return <SOPEditor onSaveSuccess={() => {}} />;
    }
    
    if (isViewRoute && sopId) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{sopLoading ? "Loading..." : sop?.title}</h1>
            {isAdmin && sop && (
              <Button className="flex items-center gap-2" asChild>
                <a href={`/sop/${sopId}/edit`}>Edit SOP</a>
              </Button>
            )}
          </div>
          
          {sopLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : (
            <SOPViewer sopId={sopId} isAdmin={isAdmin} />
          )}
        </div>
      );
    }
    
    if (isEditRoute && isAdmin && sopId) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Edit SOP</h1>
          <SOPEditor existingSOP={sop} onSaveSuccess={() => {}} />
        </div>
      );
    }
    
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          Please select a standard operating procedure from the sidebar to view its details.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SOPSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container py-6 px-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}