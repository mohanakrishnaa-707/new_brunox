import { Navigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, UserPlus, User, Waves } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen gradient-ocean flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-wave mb-4">
            <Waves className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold">BrunoX</h2>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const currentTab = location.pathname === '/' ? 'chat' : location.pathname.slice(1);

  const navigateTo = (value: string) => {
    const path = value === 'chat' ? '/' : `/${value}`;
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-ocean rounded-lg shadow-glow">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
            <h1 className="font-bold text-xl ">
              BrunoX Chat
            </h1>
            <p className="text-xs text-muted-foreground">
              Decentralized Messaging
            </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <div className="text-sm text-muted-foreground">
                Welcome, {user.email?.split('@')[0]}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="max-w-6xl mx-auto">
          <Tabs value={currentTab} onValueChange={navigateTo} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 data-[state=active]:gradient-ocean data-[state=active]:text-white transition-smooth"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger 
                value="add-friend" 
                className="flex items-center gap-2 data-[state=active]:gradient-ocean data-[state=active]:text-white transition-smooth"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Friend</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex items-center gap-2 data-[state=active]:gradient-ocean data-[state=active]:text-white transition-smooth"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default Layout;