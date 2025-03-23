import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch user profile for avatar
  const { data: profile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
    }
    return user?.username.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 lg:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center">
            <span className="text-primary-600 font-bold text-xl">Skill Forge</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatarUrl} alt={user?.username} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
