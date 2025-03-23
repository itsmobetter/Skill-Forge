import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLLM } from "@/hooks/use-llm";
import { Loader2, Send, Settings } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
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
  const { askQuestion, isLoading } = useLLM();

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

  // Auto scroll to bottom on new messages
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

    try {
      // Generate AI response
      const response = await askQuestion({
        courseId,
        question: input
      });

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        role: "assistant",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      // Add error message as AI
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        role: "assistant",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
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
                "chat-message max-w-[80%] p-3 rounded-tl-lg rounded-tr-lg",
                message.role === "assistant" 
                  ? "bg-slate-100 text-slate-700 rounded-br-lg rounded-bl-lg ml-auto" 
                  : "bg-primary-50 text-slate-700 rounded-br-lg rounded-bl-lg mr-auto"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message max-w-[80%] p-3 rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-lg ml-auto bg-slate-100 text-slate-700">
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
            <span>Powered by {apiConfig?.provider || 'OpenAI'}</span>
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
