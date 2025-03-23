import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Loader2 } from "lucide-react";

// Set the workerSrc for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

export default function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error.message);
    setIsLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return numPages ? Math.min(Math.max(1, newPageNumber), numPages) : 1;
    });
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.6));
  };

  const handleDownload = () => {
    window.open(pdfUrl, "_blank");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-slate-200 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 flex justify-center bg-slate-100 min-h-[500px]">
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
