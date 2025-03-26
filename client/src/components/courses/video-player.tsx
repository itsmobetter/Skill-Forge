import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Add the YouTube API types
declare global {
  interface Window {
    YT: any; // Using any for YouTube API to avoid TypeScript errors
    onYouTubeIframeAPIReady: () => void;
  }
}

// Basic types for YouTube player
interface YouTubePlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  moduleId: string;
}

export default function VideoPlayer({ videoUrl, courseId, moduleId }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
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

  // Initialize YouTube API
  useEffect(() => {
    if (!videoId) {
      setError("Invalid video URL");
      setIsLoading(false);
      return;
    }

    // Create a container element for the YouTube player
    const containerId = `youtube-player-${moduleId}`;
    const existingPlayer = document.getElementById(containerId);
    if (!existingPlayer && playerContainerRef.current) {
      const playerDiv = document.createElement('div');
      playerDiv.id = containerId;
      playerContainerRef.current.appendChild(playerDiv);
      
      // Add styles directly via Javascript
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        #youtube-player-${moduleId} {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        iframe {
          width: 100%;
          height: 100%;
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Function to initialize the YouTube player
    const initializeYouTubePlayer = () => {
      if (!window.YT || !window.YT.Player) {
        // If YT is not available yet, wait and try again
        setTimeout(initializeYouTubePlayer, 100);
        return;
      }

      if (playerRef.current) {
        // Player already initialized
        return;
      }

      try {
        playerRef.current = new window.YT.Player(containerId, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              setIsLoading(false);
              setVideoDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              // State 1 is playing
              if (event.data === window.YT.PlayerState.PLAYING) {
                if (!videoStarted) {
                  setVideoStarted(true);
                  updateProgressMutation.mutate({ progress: 5 });
                }
                
                // Set interval to check video progress
                if (checkIntervalRef.current) {
                  clearInterval(checkIntervalRef.current);
                }
                
                checkIntervalRef.current = setInterval(() => {
                  if (playerRef.current) {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    setWatchedDuration(currentTime);
                    setVideoDuration(duration);
                    
                    // Calculate percentage watched
                    const percentage = Math.min(Math.round((currentTime / duration) * 100), 100);
                    setWatchPercentage(percentage);
                    
                    // Update progress in 25% increments
                    if (percentage >= 25 && watchPercentage < 25) {
                      updateProgressMutation.mutate({ progress: 25 });
                    } else if (percentage >= 50 && watchPercentage < 50) {
                      updateProgressMutation.mutate({ progress: 50 });
                    } else if (percentage >= 75 && watchPercentage < 75) {
                      updateProgressMutation.mutate({ progress: 75 });
                    }
                    
                    // Video is considered complete when user watches at least 95% of it
                    if (percentage >= 95 && !videoCompleted) {
                      setVideoCompleted(true);
                      updateProgressMutation.mutate({ progress: 100 });
                      
                      toast({
                        title: "Video Completed",
                        description: "Your progress has been saved!",
                      });
                      
                      // Clear interval after video is completed
                      if (checkIntervalRef.current) {
                        clearInterval(checkIntervalRef.current);
                        checkIntervalRef.current = null;
                      }
                    }
                  }
                }, 3000); // Check every 3 seconds
              }
              
              // State 0 is ended
              if (event.data === window.YT.PlayerState.ENDED && !videoCompleted) {
                setVideoCompleted(true);
                updateProgressMutation.mutate({ progress: 100 });
                
                toast({
                  title: "Video Completed",
                  description: "Your progress has been saved!",
                });
                
                // Clear interval after video is ended
                if (checkIntervalRef.current) {
                  clearInterval(checkIntervalRef.current);
                  checkIntervalRef.current = null;
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        setError("Failed to initialize video player");
        setIsLoading(false);
      }
    };

    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Set up callback for when API is ready
        window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
      } else {
        setError("Failed to load YouTube API");
        setIsLoading(false);
      }
    } else {
      // If YT API is already loaded, initialize the player directly
      initializeYouTubePlayer();
    }

    return () => {
      // Clean up
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, courseId, moduleId, toast]);

  // Update watch percentage when watched duration changes
  useEffect(() => {
    if (videoDuration > 0) {
      const percentage = Math.min(Math.round((watchedDuration / videoDuration) * 100), 100);
      setWatchPercentage(percentage);
    }
  }, [watchedDuration, videoDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="flex flex-col">
      <div ref={playerContainerRef} className="relative pb-[56.25%] bg-black w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
            <p>{error}</p>
          </div>
        )}
        
        {/* Style is moved to useEffect */}
      </div>
      
      {/* Video progress indicator */}
      {videoStarted && !error && (
        <div className="mt-2 px-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{formatTime(watchedDuration)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
          <Progress value={watchPercentage} className="h-1" />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-slate-500">
              {videoCompleted 
                ? "Completed" 
                : `${watchPercentage}% completed`}
            </span>
            {videoCompleted && (
              <span className="text-green-600 font-medium">✓ Marked as complete</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
