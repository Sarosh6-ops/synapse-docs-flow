import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, Upload, Search, Clock, TrendingUp, MessageSquare,
  User, Bell, Settings, Download, Eye, Zap, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Document as DocumentType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.3 } },
  out: { opacity: 0 }
};

const itemVariants = {
  initial: { y: 20, opacity: 0 },
  in: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const SkeletonCard = () => (
  <div className="p-6 bg-card-elevated border border-border/50 rounded-lg space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-border/50">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DocumentType[];
      setDocuments(docsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching documents: ", error);
      toast({ title: "Error", description: "Could not fetch documents.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const stats = [
    { label: 'Documents Analyzed', value: '1,247', change: '+12%', icon: FileText },
    { label: 'AI Insights Generated', value: '3,891', change: '+8%', icon: Zap },
    { label: 'Time Saved (Hours)', value: '156', change: '+24%', icon: Clock },
    { label: 'Active Collaborations', value: '23', change: '+5%', icon: MessageSquare }
  ];

  const handleDocumentClick = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    toast({ title: "Upload Started", description: `Uploading ${file.name}...` });

    try {
      const fileId = uuidv4();
      const storageRef = ref(storage, `uploads/${user.uid}/${fileId}-${file.name}`);

      const snapshot = await uploadBytes(storageRef, file);

      await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        title: file.name,
        storagePath: snapshot.ref.fullPath,
        status: 'processing',
        uploadedAt: serverTimestamp(),
        size: file.size,
        type: file.type,
      });

      toast({ title: "Upload Successful", description: `${file.name} is now being processed by AI.` });
    } catch (error) {
      console.error("Error uploading file: ", error);
      toast({ title: "Upload Failed", description: "Could not upload the file. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getStatusBadge = (status: DocumentType['status']) => {
    switch (status) {
      case 'analyzed': return <Badge className="bg-success text-success-foreground">Analyzed</Badge>;
      case 'processing': return <Badge variant="secondary" className="animate-pulse"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'archived': return <Badge variant="outline">Archived</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    // Firebase Timestamps can be null before they are set by the server
    if (typeof timestamp.toDate !== 'function') {
        return 'Pending...';
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp.toDate());
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="min-h-screen bg-background">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.jpg,.png" disabled={isUploading} />

      <motion.header variants={itemVariants} className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-lg metro-gradient flex items-center justify-center"><FileText className="h-4 w-4 text-primary-foreground" /></div><h1 className="text-xl font-bold gradient-text">KMRL Synapse</h1></div>
              <nav className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="font-medium" disabled>Dashboard</Button>
                <Button variant="ghost" asChild><Link to="/chat">Chat</Link></Button>
                <Button variant="ghost" asChild><Link to="/analytics">Analytics</Link></Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
              <div className="flex items-center space-x-3 pl-4 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-metro-blue/20 flex items-center justify-center"><User className="h-4 w-4 text-metro-blue" /></div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.displayName || 'Arjun Nair'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'EMP001'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome back, {user?.displayName?.split(' ')[0] || 'Arjun'}</h2>
          <p className="text-muted-foreground">Here's what's happening with your documents today.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} whileHover={{ scale: 1.02 }} className="card-glow">
              <Card className="p-6 bg-card-elevated border border-border/50"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p><div className="flex items-center space-x-1 mt-2"><TrendingUp className="h-3 w-3 text-success" /><span className="text-xs text-success">{stat.change}</span></div></div><div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><stat.icon className="h-6 w-6 text-primary" /></div></div></Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-8 glass-effect border-2 border-dashed border-primary/30 text-center hover:border-primary/50 transition-colors">
            <motion.div whileHover={{ scale: 1.05 }} className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"><Upload className="h-8 w-8 text-primary" /></div>
              <div>
                <h3 className="text-xl font-semibold">Upload New Document</h3>
                <p className="text-muted-foreground mt-2">Drag and drop your files here, or click to browse</p>
              </div>
              <Button variant="metro" size="lg" onClick={handleUploadClick} disabled={isUploading}>
                {isUploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </motion.div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between"><h3 className="text-2xl font-bold">Recent Documents</h3><div className="flex items-center space-x-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64 bg-input/50" /></div></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
              : documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase())).map((doc) => (
                  <motion.div key={doc.id} variants={itemVariants} whileHover={{ scale: 1.02 }} className="card-glow cursor-pointer" onClick={() => handleDocumentClick(doc.id)}>
                    <Card className="p-6 bg-card-elevated border border-border/50">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2 truncate" title={doc.title}>{doc.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1"><FileText className="h-3 w-3" /><span>{doc.type}</span></span>
                              <span className="flex items-center space-x-1"><Download className="h-3 w-3" /><span>{formatBytes(doc.size)}</span></span>
                              <span className="flex items-center space-x-1"><Clock className="h-3 w-3" /><span>{formatDate(doc.uploadedAt)}</span></span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(doc.status)}
                            {doc.aiScore && (<div className="flex items-center space-x-1"><Zap className="h-3 w-3 text-primary" /><span className="text-xs font-medium">{doc.aiScore}%</span></div>)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <span className="text-sm text-muted-foreground">{doc.insights || 0} AI insights available</span>
                          <Button variant="ghost" size="sm"><Eye className="h-3 w-3 mr-2" />View Details</Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default Dashboard;