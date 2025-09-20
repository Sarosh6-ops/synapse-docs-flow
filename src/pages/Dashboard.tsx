import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Search, 
  Clock, 
  TrendingUp, 
  MessageSquare,
  User,
  Bell,
  Settings,
  Download,
  Eye,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Document } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      setDocuments(docsData);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    { label: 'Documents Analyzed', value: '1,247', change: '+12%', icon: FileText },
    { label: 'AI Insights Generated', value: '3,891', change: '+8%', icon: Zap },
    { label: 'Time Saved (Hours)', value: '156', change: '+24%', icon: Clock },
    { label: 'Active Collaborations', value: '23', change: '+5%', icon: MessageSquare }
  ];

  const handleDocumentClick = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map((file) => {
      const storageRef = ref(storage, `documents/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error("Upload failed:", error);
            toast({
              title: "Upload Failed",
              description: `Could not upload ${file.name}.`,
              variant: "destructive",
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await addDoc(collection(db, "documents"), {
                title: file.name,
                type: file.type,
                size: file.size,
                downloadURL: downloadURL,
                uploadedAt: serverTimestamp(),
                status: 'processing',
                insights: 0,
                aiScore: null,
              });
              toast({
                title: "Upload Successful",
                description: `${file.name} has been uploaded.`,
              });
              resolve();
            } catch (error) {
              console.error("Error adding document to Firestore:", error);
              toast({
                title: "Error",
                description: `There was an error saving ${file.name}.`,
                variant: "destructive",
              });
              reject(error);
            }
          }
        );
      });
    });

    Promise.all(uploadPromises)
      .catch((error) => console.error("One or more uploads failed", error))
      .finally(() => setUploading(false));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg metro-gradient flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold gradient-text">KMRL Synapse</h1>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="font-medium">Dashboard</Button>
                <Button variant="ghost" onClick={() => navigate('/chat')}>Chat</Button>
                <Button variant="ghost">Analytics</Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3 pl-4 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-metro-blue/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-metro-blue" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Arjun Nair</p>
                  <p className="text-xs text-muted-foreground">EMP001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold">Welcome back, Arjun</h2>
          <p className="text-muted-foreground">Here's what's happening with your documents today.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="card-glow"
            >
              <Card className="p-6 bg-card-elevated border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">{stat.change}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="p-8 glass-effect border-2 border-dashed border-primary/30 text-center hover:border-primary/50 transition-colors">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Upload New Document</h3>
                <p className="text-muted-foreground mt-2">
                  Drag and drop your files here, or click to browse
                </p>
              </div>
              <Button variant="metro" size="lg" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </motion.div>
          </Card>
        </motion.div>

        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Recent Documents</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-input/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="card-glow cursor-pointer"
                onClick={() => handleDocumentClick(doc.id)}
              >
                <Card className="p-6 bg-card-elevated border border-border/50">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{doc.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{doc.type}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>{(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{doc.uploadedAt ? `${formatDistanceToNow(doc.uploadedAt.toDate())} ago` : 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge 
                          variant={doc.status === 'analyzed' ? 'default' : 'secondary'}
                          className={doc.status === 'analyzed' ? 'bg-success text-success-foreground' : ''}
                        >
                          {doc.status}
                        </Badge>
                        {doc.aiScore && (
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium">{doc.aiScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">
                        {doc.insights} AI insights available
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;