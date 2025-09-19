import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const AnalyticsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'documents'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocuments(docs);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  const getUploadsPerDay = () => {
    const uploadsByDay: { [key: string]: number } = {};
    documents.forEach(doc => {
      if (doc.uploadedAt) {
        const day = format(doc.uploadedAt.toDate(), 'yyyy-MM-dd');
        uploadsByDay[day] = (uploadsByDay[day] || 0) + 1;
      }
    });
    return Object.entries(uploadsByDay).map(([name, value]) => ({ name, uploads: value })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getCategoryDistribution = () => {
    const categories: { [key: string]: number } = {};
    documents.forEach(doc => {
        // A simple way to guess category from file type
        const type = doc.type.includes('pdf') ? 'Financial' :
                     doc.type.includes('word') ? 'Safety' :
                     'HR';
        categories[type] = (categories[type] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const uploadsPerDayData = getUploadsPerDay();
  const categoryDistributionData = getCategoryDistribution();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-8"
    >
      <h1 className="text-3xl font-bold mb-8">Document Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Documents Uploaded Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={uploadsPerDayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="uploads" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Document Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
