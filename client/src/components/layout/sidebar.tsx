import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      title: "Courses",
      href: "/courses",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
    {
      title: "My Courses",
      href: "/my-courses",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
          <path d="M15.5 12h.5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h.5" />
          <path d="M3 6h18" />
          <path d="m5 6 2-3h10l2 3" />
          <path d="M4 11h4" />
          <path d="M16 11h4" />
        </svg>
      ),
    },
    {
      title: "Certificates",
      href: "/certificates",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      title: "Settings",
      href: "/settings",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex-col flex lg:static lg:z-auto",
          isOpen ? "flex" : "hidden lg:flex"
        )}
      >
        <div className="h-full flex flex-col">
          <ScrollArea className="flex-1">
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={handleLinkClick}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 font-medium",
                      location === item.href 
                        ? "bg-primary-50 text-primary-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                </Link>
              ))}
            </nav>
          </ScrollArea>
          
          {user?.isAdmin && (
            <div className="bg-slate-50 p-4 border-t border-slate-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-secondary-100 text-secondary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-700">Admin Mode</p>
                  <p className="text-xs text-slate-500">Full access enabled</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
