import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Copy, Download, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

interface TranscriptionData {
  text: string;
  timestampedText?: TranscriptSegment[];
  videoId?: string;
}

interface TranscriptViewerProps {
  moduleId: string | undefined;
  videoUrl?: string | null;
}

export function TranscriptViewer({ moduleId, videoUrl }: TranscriptViewerProps) {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'timestamped'>('timestamped');
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
        // Transcription found, set it
        setTranscriptionData({
          text: data.text,
          timestampedText: data.timestampedText || [],
          videoId: data.videoId
        });
      } else {
        // No transcription found and video URL exists
        if (videoUrl) {
          console.log("No transcription found, auto-generating...");
          await generateTranscription();
        } else {
          setTranscriptionData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching transcription:', error);
      
      // If error occurred and we have a videoUrl, try to auto-generate
      if (videoUrl) {
        console.log("Error fetching transcription, attempting to auto-generate...");
        await generateTranscription();
      } else {
        setTranscriptionData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        setTranscriptionData({
          text: data.transcription,
          timestampedText: data.segments || [],
          videoId: data.videoId
        });
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
    if (transcriptionData?.text) {
      navigator.clipboard.writeText(transcriptionData.text)
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
    if (transcriptionData?.text) {
      const blob = new Blob([transcriptionData.text], { type: 'text/plain' });
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

  const hasTimestampedSegments = 
    transcriptionData?.timestampedText && 
    Array.isArray(transcriptionData.timestampedText) && 
    transcriptionData.timestampedText.length > 0;

  const renderTimestampedTranscript = () => {
    if (!hasTimestampedSegments) {
      return (
        <div className="text-center text-muted-foreground my-4">
          <p>Timestamped version not available. Showing raw transcript instead.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {transcriptionData?.timestampedText?.map((segment, index) => (
          <div key={index} className="border-b border-border pb-2 last:border-0">
            <div className="text-xs text-muted-foreground mb-1 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
            </div>
            <p className="text-sm">{segment.text}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Video Transcription
        </CardTitle>
        <CardDescription>
          {transcriptionData?.text 
            ? "Full text transcript of the video content" 
            : "No transcription available for this video yet"}
        </CardDescription>
      </CardHeader>
      
      {transcriptionData?.text && hasTimestampedSegments && (
        <div className="px-6 mb-2">
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'timestamped' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('timestamped')}
            >
              Timestamped
            </Button>
            <Button 
              variant={viewMode === 'raw' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('raw')}
            >
              Raw Text
            </Button>
          </div>
        </div>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transcriptionData?.text ? (
          <div className="max-h-[500px] overflow-y-auto rounded-md bg-muted p-4">
            {viewMode === 'raw' || !hasTimestampedSegments ? (
              <pre className="text-sm whitespace-pre-wrap font-sans">{transcriptionData.text}</pre>
            ) : (
              renderTimestampedTranscript()
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>This video doesn't have a transcription yet.</p>
            <p className="mt-2">A transcription should be generated automatically when a module with a video URL is created or updated.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {!transcriptionData?.text && videoUrl && (
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
        
        {transcriptionData?.text && (
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