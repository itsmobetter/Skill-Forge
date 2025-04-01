import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { SOP } from "@shared/schema";
import { SOPList, SOPViewer, SOPEditor } from "@/components/sop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SOPPage() {
  const { user, isLoading } = useAuth();
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("sops");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const isAdmin = user?.isAdmin || false;

  const handleSelectSOP = (sop: SOP) => {
    setSelectedSOP(sop);
    setIsEditing(false);
    setActiveTab("view");
  };

  const handleEditSOP = () => {
    setIsEditing(true);
    setActiveTab("edit");
  };

  const handleSaveSuccess = () => {
    setIsEditing(false);
    setActiveTab("view");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sops">SOP List</TabsTrigger>
          <TabsTrigger value="view" disabled={!selectedSOP}>
            View SOP
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!(isAdmin && (selectedSOP || isEditing))}>
            {selectedSOP ? "Edit SOP" : "Create SOP"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sops" className="mt-6">
          <SOPList onSelectSOP={handleSelectSOP} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="view" className="mt-6">
          {selectedSOP ? (
            <SOPViewer 
              sopId={selectedSOP.id} 
              onEdit={handleEditSOP}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                Please select a standard operating procedure to view.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          {isAdmin && (isEditing ? (
            <SOPEditor 
              existingSOP={selectedSOP || undefined} 
              onSaveSuccess={handleSaveSuccess}
            />
          ) : (
            <SOPEditor onSaveSuccess={handleSaveSuccess} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}