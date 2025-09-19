import { motion } from 'framer-motion';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold gradient-text">Analytics Page</h1>
        <p className="text-muted-foreground mt-2">
          This page is under construction. AI-powered analytics will be available here soon.
        </p>
      </motion.div>
    </div>
  );
};

export default Analytics;
