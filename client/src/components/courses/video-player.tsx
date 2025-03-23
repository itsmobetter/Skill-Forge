import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  moduleId: string;
}

export default function VideoPlayer({ videoUrl, courseId, moduleId }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const videoIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Mutation to update progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ progress }: { progress: number }) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/modules/${moduleId}/progress`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/courses/${courseId}/progress`] });
    },
  });

  useEffect(() => {
    if (!videoId) {
      setError("Invalid video URL");
      setIsLoading(false);
      return;
    }

    // In a real implementation, you could use the YouTube API to track video progress
    // For this example, we'll simulate progress updates
    const interval = setInterval(() => {
      const randomProgress = Math.floor(Math.random() * 5) + 1; // Random progress between 1-5%
      updateProgressMutation.mutate({ progress: randomProgress });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [videoId, courseId, moduleId, updateProgressMutation]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError("Failed to load video");
    setIsLoading(false);
  };

  return (
    <div className="relative pb-[56.25%] bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
          <p>{error}</p>
        </div>
      ) : (
        <iframe
          ref={videoRef}
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Course video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
}
