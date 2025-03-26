import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLLM } from "@/hooks/use-llm";
import { Loader2, Send, Settings } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface AiAssistantProps {
  courseId: string;
  moduleName?: string;
}

export default function AiAssistant({ courseId, moduleName }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  // LLM hook with streaming callbacks
  const { askQuestion, isLoading } = useLLM({
    onStream: (chunk) => {
      if (streamingMessageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: msg.content + chunk } 
            : msg
        ));
      }
    },
    onStreamComplete: (fullText) => {
      if (streamingMessageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: fullText, isStreaming: false } 
            : msg
        ));
        setStreamingMessageId(null);
      }
    }
  });

  // Fetch API settings
  const { data: apiConfig } = useQuery({
    queryKey: ["/api/user/settings/api"],
  });

  // Initialize with greeting
  useEffect(() => {
    if (!isInitialized) {
      const greeting = {
        id: "greeting",
        content: `Hello! I'm your AI assistant for this course${moduleName ? ` on ${moduleName}` : ''}. How can I help you learn?`,
        role: "assistant" as const,
        timestamp: new Date()
      };
      setMessages([greeting]);
      setIsInitialized(true);
    }
  }, [isInitialized, moduleName]);

  // Auto scroll to bottom on new messages or when streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Prepare for streaming response
    const streamingId = (Date.now() + 1).toString();
    
    // Check if streaming is enabled in API config
    const streamingEnabled = apiConfig?.streaming === true;
    
    if (streamingEnabled) {
      // Add empty assistant message that will be filled incrementally
      const emptyStreamingMessage: Message = {
        id: streamingId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, emptyStreamingMessage]);
      setStreamingMessageId(streamingId);
    }

    try {
      // Generate AI response (streaming handled by callbacks if enabled)
      const response = await askQuestion({
        courseId,
        question: input
      });

      // If not streaming, add the full AI message now
      if (!streamingEnabled) {
        const aiMessage: Message = {
          id: streamingId,
          content: response.answer,
          role: "assistant",
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: any) {
      // Add error message as AI
      const errorMessage: Message = {
        id: streamingId,
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date()
      };

      // Remove any pending streaming message and add the error message
      setMessages((prev) => {
        const filtered = streamingMessageId 
          ? prev.filter(msg => msg.id !== streamingMessageId) 
          : prev;
        return [...filtered, errorMessage];
      });
      
      setStreamingMessageId(null);
    }
  };

  // Function to render message content with Markdown support
  const renderMessageContent = (content: string, isAssistant: boolean) => {
    if (isAssistant) {
      return (
        <ReactMarkdown
          className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-700 
                     prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:my-1.5
                     prose-a:text-primary-600 prose-code:text-primary-600 prose-code:bg-primary-50 
                     prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:hidden prose-code:after:hidden"
        >
          {content}
        </ReactMarkdown>
      );
    }
    return <p className="text-sm">{content}</p>;
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
            <p className="text-sm text-slate-500">Ask questions about this course</p>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "chat-message p-3 rounded-lg",
                message.role === "assistant" 
                  ? "bg-slate-100 text-slate-700 ml-auto max-w-[80%]" 
                  : "bg-primary-50 text-slate-700 mr-auto max-w-[80%]"
              )}
            >
              {renderMessageContent(message.content, message.role === "assistant")}
              {message.isStreaming && (
                <div className="h-4 w-4 mt-1">
                  <span className="inline-block h-1.5 w-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                  <span className="inline-block h-1.5 w-1.5 ml-1 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="inline-block h-1.5 w-1.5 ml-1 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}
            </div>
          ))}
          {isLoading && !streamingMessageId && (
            <div className="chat-message max-w-[80%] p-3 rounded-lg ml-auto bg-slate-100 text-slate-700">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <CardFooter className="p-4 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="w-full space-y-2">
          <div className="flex w-full">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-r-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              className="rounded-l-none"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Powered by {apiConfig?.provider || 'Google AI'}</span>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 flex items-center gap-1 text-primary-600 hover:text-primary-500"
              onClick={() => window.location.href = "/settings?tab=api"}
            >
              <Settings className="h-3 w-3" />
              API Settings
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
