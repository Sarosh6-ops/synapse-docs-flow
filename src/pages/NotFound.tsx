import { motion } from 'framer-motion';
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center space-y-6"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold gradient-text">404</h1>
          <p className="text-2xl font-semibold text-foreground">Page Not Found</p>
          <p className="text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Button asChild variant="metro">
          <Link to="/dashboard">Return to Dashboard</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
