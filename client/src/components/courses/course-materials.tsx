import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table2, File } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: string; // Allow any string for type
  fileSize: string;
  url: string;
}

interface CourseMaterialsProps {
  materials: Material[];
}

export default function CourseMaterials({ materials }: CourseMaterialsProps) {
  // Helper to get icon based on material type
  const getIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "spreadsheet":
        return <Table2 className="h-5 w-5 text-green-500" />;
      case "document":
        return <File className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-slate-500" />;
    }
  };

  // Helper to handle download (in a real app, this would trigger the actual download)
  const handleDownload = (material: Material) => {
    window.open(material.url, "_blank");
  };

  return (
    <Card className="overflow-hidden mb-6">
      <CardHeader className="px-4 py-3 border-b border-slate-200">
        <CardTitle className="text-lg font-medium">Course Materials</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {materials.map((material) => (
            <div 
              key={material.id}
              className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {getIcon(material.type)}
              <div className="flex-1 ml-3">
                <h3 className="text-sm font-medium text-slate-900">{material.title}</h3>
                <p className="text-xs text-slate-500">
                  {material.type.charAt(0).toUpperCase() + material.type.slice(1)} • {material.fileSize}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDownload(material)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
