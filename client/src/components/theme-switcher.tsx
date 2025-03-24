import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

const themes = [
  {
    name: "Light",
    id: "light",
    icon: Sun,
    preview: {
      background: "bg-white",
      foreground: "text-black",
      card: "bg-gray-100",
      primary: "bg-primary",
      muted: "text-gray-600"
    }
  },
  {
    name: "Dark",
    id: "dark",
    icon: Moon,
    preview: {
      background: "bg-slate-950",
      foreground: "text-white",
      card: "bg-slate-900",
      primary: "bg-primary",
      muted: "text-gray-400"
    }
  },
  {
    name: "System",
    id: "system",
    icon: Monitor,
    preview: null // Uses either light or dark based on system
  }
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Determine which icon to show based on current theme
  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const ThemeIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <ThemeIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {themes.map((item) => (
          <DropdownMenuItem 
            key={item.id}
            className="flex items-center justify-between cursor-pointer"
            onMouseEnter={() => setShowPreview(true)}
            onMouseLeave={() => setShowPreview(false)}
            onClick={() => setTheme(item.id)}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </div>
            {theme === item.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />

        {/* Preview section */}
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-2">Theme Preview</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.filter(t => t.preview).map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all ${theme === item.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setTheme(item.id)}
              >
                <CardContent className={`p-2 ${item.preview?.background}`}>
                  <div className="flex flex-col gap-1 items-center justify-center h-14">
                    <div className={`text-xs font-medium ${item.preview?.foreground}`}>{item.name}</div>
                    <div className={`w-full h-3 rounded-sm ${item.preview?.primary}`}></div>
                    <div className={`text-[10px] ${item.preview?.muted}`}>Preview</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}