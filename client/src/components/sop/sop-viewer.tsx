import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SOP } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ClipboardList, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface SOPViewerProps {
  sopId: string;
  onEdit?: () => void;
  isAdmin?: boolean;
}

export function SOPViewer({ sopId, onEdit, isAdmin = false }: SOPViewerProps) {
  const { data: sop, isLoading, error } = useQuery<SOP>({
    queryKey: [`/api/sop/${sopId}`],
    enabled: !!sopId,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sop) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading SOP</CardTitle>
          <CardDescription>
            There was a problem loading this standard operating procedure. 
            {error && ` Error: ${error.message}`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Process responsibilities object to array for rendering
  const responsibilitiesArray = Object.entries(sop.responsibilities || {}).map(
    ([role, description]) => ({ role, description })
  );

  // Process procedure object to array for rendering
  const procedureArray = Object.entries(sop.procedure || {}).map(
    ([step, description]) => ({ step, description })
  );

  // Process references object to array for rendering
  const referencesArray = Object.entries(sop.references || {}).map(
    ([title, link]) => ({ title, link })
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 relative">
        {isAdmin && (
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              onClick={onEdit}
            >
              Edit SOP
            </Button>
          </div>
        )}
        <div className="flex items-start space-x-2">
          <FileText className="h-6 w-6 text-primary mt-1" />
          <div>
            <CardTitle className="text-2xl">{sop.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-3">
              <div className="flex items-center">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <span>Created: {formatDate(sop.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <span>Updated: {formatDate(sop.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[calc(100vh-240px)] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Objective
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{sop.objective}</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                Scope
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{sop.scope}</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                Responsibilities
              </h3>
              <Accordion type="multiple" className="w-full">
                {responsibilitiesArray.map((item, index) => (
                  <AccordionItem key={`responsibility-${index}`} value={`responsibility-${index}`}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">Role</Badge>
                        <span>{item.role}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-1 pb-3 text-muted-foreground whitespace-pre-line">
                      {item.description}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Procedure
              </h3>
              <Accordion type="multiple" className="w-full">
                {procedureArray.map((item, index) => (
                  <AccordionItem key={`procedure-${index}`} value={`procedure-${index}`}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center">
                        <Badge className="mr-2">{index + 1}</Badge>
                        <span>{item.step}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-1 pb-3 text-muted-foreground whitespace-pre-line">
                      {item.description}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {referencesArray.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  References
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  {referencesArray.map((item, index) => (
                    <li key={`reference-${index}`} className="ml-2">
                      {item.title}
                      {item.link && (
                        <a 
                          href={item.link.startsWith('http') ? item.link : `https://${item.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary ml-2 text-sm hover:underline"
                        >
                          [Link]
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}