import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AnalyticsPage = () => {
  const navigate = useNavigate();

  // Demo data for the charts
  const monthlyData = [
    { month: 'Jan', processed: 120 },
    { month: 'Feb', processed: 150 },
    { month: 'Mar', processed: 170 },
    { month: 'Apr', processed: 210 },
    { month: 'May', processed: 180 },
    { month: 'Jun', processed: 250 },
    { month: 'Jul', processed: 230 },
    { month: 'Aug', processed: 290 },
  ];

  const categoryData = [
    { name: 'Financial', value: 45 },
    { name: 'Safety', value: 25 },
    { name: 'HR', value: 15 },
    { name: 'Technical', value: 10 },
    { name: 'Operational', value: 5 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const insightsData = [
    { date: 'Week 1', insights: 50 },
    { date: 'Week 2', insights: 80 },
    { date: 'Week 3', insights: 120 },
    { date: 'Week 4', insights: 150 },
    { date: 'Week 5', insights: 200 },
    { date: 'Week 6', insights: 230 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background p-4 sm:p-6 md:p-8"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Synapse Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Visualizing your organization's data pulse.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {/* Bar Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="glass-effect h-full">
              <CardHeader>
                <CardTitle>Documents Processed per Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="processed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div variants={itemVariants}>
            <Card className="glass-effect h-full">
              <CardHeader>
                <CardTitle>Document Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Line Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="glass-effect h-full">
              <CardHeader>
                <CardTitle>AI Insights Generated Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={insightsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="insights" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsPage;
