import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const user = useQuery(api.auth.currentUser);
  const { signOut } = useAuthActions();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
          ProjectHub
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/projects" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/projects' ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  Projects
                </Link>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {user.name || user.email}
                </span>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </>
          ) : !isAuthPage ? (
            <div className="space-x-2">
              <Link to="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
