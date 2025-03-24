import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Copy, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptViewerProps {
  moduleId: string | undefined;
  videoUrl?: string | null;
}

export function TranscriptViewer({ moduleId, videoUrl }: TranscriptViewerProps) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (moduleId) {
      fetchTranscription();
    }
  }, [moduleId]);

  const fetchTranscription = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('GET', `/api/modules/${moduleId}/transcription`);
      const data = await res.json();
      
      if (data && data.text) {
        setTranscription(data.text);
      } else {
        setTranscription(null);
      }
    } catch (error) {
      console.error('Error fetching transcription:', error);
      setTranscription(null);
    } finally {
      setLoading(false);
    }
  };

  const generateTranscription = async () => {
    if (!videoUrl) {
      toast({
        title: "Video URL Missing",
        description: "This module doesn't have a video URL associated with it.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const res = await apiRequest('POST', '/api/llm/transcribe', {
        videoUrl,
        moduleId
      });
      
      const data = await res.json();
      
      if (data && data.transcription) {
        setTranscription(data.transcription);
        toast({
          title: "Transcription Generated",
          description: "Video transcription has been successfully generated and saved.",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate transcription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating transcription:', error);
      toast({
        title: "Generation Error",
        description: `Error generating transcription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription)
        .then(() => {
          toast({
            title: "Copied",
            description: "Transcription copied to clipboard",
          });
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          toast({
            title: "Copy Failed",
            description: "Failed to copy transcription to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const downloadTranscription = () => {
    if (transcription) {
      const blob = new Blob([transcription], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription-${moduleId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Video Transcription
        </CardTitle>
        <CardDescription>
          {transcription 
            ? "Full text transcript of the video content" 
            : "No transcription available for this video yet"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transcription ? (
          <div className="max-h-[500px] overflow-y-auto rounded-md bg-muted p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{transcription}</pre>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>This video doesn't have a transcription yet.</p>
            <p className="mt-2">Generate a transcription to enable AI assistance with the video content.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {!transcription && videoUrl && (
            <Button 
              onClick={generateTranscription} 
              disabled={generating || !videoUrl}
              className="mr-2"
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Transcription
            </Button>
          )}
        </div>
        
        {transcription && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTranscription}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}