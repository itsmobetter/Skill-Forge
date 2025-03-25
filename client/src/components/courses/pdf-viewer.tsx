import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, CheckCircle, MessageSquare, Highlighter } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLLM } from "@/hooks/use-llm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

// Set the workerSrc for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  courseId: string;
  moduleId: string;
}

export default function PDFViewer({ pdfUrl, title, courseId, moduleId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTime, setViewTime] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [aiResponseLoading, setAiResponseLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiPopoverOpen, setIsAiPopoverOpen] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { askQuestion } = useLLM();

  // Required time in seconds to mark PDF as complete
  const requiredViewTimeInSeconds = 30;
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ progress }: { progress: number }) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/modules/${moduleId}/progress`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
    },
  });

  // Start tracking view time when document loads successfully
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setIsActive(true);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error.message);
    setIsLoading(false);
  };

  // Track view time
  useEffect(() => {
    if (isActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setViewTime(prevTime => {
          const newTime = prevTime + 1;
          
          // Mark as complete after required viewing time
          if (newTime >= requiredViewTimeInSeconds && !isCompleted) {
            setIsCompleted(true);
            updateProgressMutation.mutate({ progress: 100 });
            
            toast({
              title: "PDF Material Completed",
              description: `You have completed viewing "${title}"`,
            });
            
            // Clear the interval once completed
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isCompleted, title, updateProgressMutation, toast]);

  // Handle user interactions to ensure they're actively viewing
  useEffect(() => {
    const handleUserActivity = () => {
      if (!isCompleted) {
        setIsActive(true);
      }
    };
    
    // Events to track user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    
    // Set inactive after 10 seconds of no interaction
    const inactivityTimeout = setTimeout(() => {
      if (!isCompleted) {
        setIsActive(false);
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearTimeout(inactivityTimeout);
    };
  }, [isCompleted]);

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return numPages ? Math.min(Math.max(1, newPageNumber), numPages) : 1;
    });
    
    // Ensure timer is active when user interacts with PDF
    setIsActive(true);
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.0));
    setIsActive(true);
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.6));
    setIsActive(true);
  };

  const handleDownload = () => {
    window.open(pdfUrl, "_blank");
    setIsActive(true);
  };
  
  // Handle text selection in the PDF
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '') {
        setSelectedText(selection.toString().trim());
        // Show a visual indicator that text is selected
        toast({
          title: "Text Selected",
          description: "You can now ask the AI assistant about this selection.",
          duration: 3000,
        });
        // Automatically open the AI popover when text is selected
        setIsAiPopoverOpen(true);
      }
    };
    
    // Only add the event listener to the PDF container
    const container = pdfContainerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleTextSelection);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleTextSelection);
      }
    };
  }, [toast]);
  
  // Add CSS to style the selected text
  useEffect(() => {
    // Add a custom CSS rule to highlight selected text within the PDF viewer
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .pdf-document ::selection {
        background-color: rgba(59, 130, 246, 0.3);
        color: inherit;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Handle asking a question about the selected text
  const handleAskQuestion = async () => {
    if (!question) {
      toast({
        title: "Missing question",
        description: "Please enter your question about the selected text.",
        variant: "destructive"
      });
      return;
    }
    
    setAiResponseLoading(true);
    
    try {
      const response = await askQuestion({
        courseId,
        moduleId,
        question: `Based on this content: "${selectedText}"\n\nAnswer this question: ${question}`
      });
      
      setAiResponse(response.answer);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAiResponseLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-slate-200 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {selectedText && (
            <Popover open={isAiPopoverOpen} onOpenChange={setIsAiPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask AI
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Selected Text:</h4>
                    <div className="text-sm p-2 bg-slate-100 rounded-md max-h-24 overflow-y-auto">
                      {selectedText || "No text selected"}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium mb-1">
                      Your Question:
                    </label>
                    <Textarea
                      id="question"
                      placeholder="Ask a question about this selection..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full"
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleAskQuestion} 
                    disabled={aiResponseLoading || !question}
                  >
                    {aiResponseLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : "Ask Question"}
                  </Button>
                  
                  {aiResponse && (
                    <div>
                      <h4 className="font-medium mb-2">AI Response:</h4>
                      <div className="text-sm p-3 bg-slate-100 rounded-md max-h-40 overflow-y-auto">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex justify-center bg-slate-100 min-h-[500px]" ref={pdfContainerRef}>
        {isLoading && (
          <div className="flex items-center justify-center h-[500px] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-[500px] w-full">
            <p className="text-red-500">Error loading PDF: {error}</p>
          </div>
        )}
        
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<Loader2 className="h-8 w-8 animate-spin text-primary-600" />}
          className="pdf-document"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            loading={<Loader2 className="h-8 w-8 animate-spin text-primary-600" />}
            className="shadow-md"
          />
        </Document>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-2 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <Input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
              className="w-16 text-center"
            />
            <span className="px-2">
              of {numPages || 0}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(1)}
            disabled={numPages !== null && pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.6}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
