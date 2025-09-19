import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
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
  Zap,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db, storage, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Document } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };

    setLoading(true);
    const q = query(collection(db, 'documents'), where('uid', '==', user.uid), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents: ", error);
      toast({ title: "Error", description: "Could not fetch documents.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const stats = [
    { label: 'Documents Analyzed', value: documents.filter(d => d.status === 'analyzed').length, change: '+12%', icon: FileText },
    { label: 'AI Insights Generated', value: documents.reduce((acc, doc) => acc + (doc.insights || 0), 0), change: '+8%', icon: Zap },
    { label: 'Time Saved (Hours)', value: '156', change: '+24%', icon: Clock },
    { label: 'Active Collaborations', value: '23', change: '+5%', icon: MessageSquare }
  ];

  const handleDocumentClick = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
  };

  const handleUpload = (file: File) => {
    if (!user) {
      toast({ title: "Not authenticated", description: "You must be logged in to upload files.", variant: "destructive" });
      return;
    }

    const toastId = "upload-toast";
    toast({
      id: toastId,
      title: "Uploading...",
      description: `Your document "${file.name}" is being uploaded.`,
    });

    const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // In a real app, you could update the toast with the progress.
      },
      (error) => {
        toast({
          id: toastId,
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          await addDoc(collection(db, 'documents'), {
            uid: user.uid,
            title: file.name,
            type: file.type || 'unknown',
            size: file.size,
            downloadUrl: downloadURL,
            uploadedAt: serverTimestamp(),
            status: 'uploaded'
          });
          toast({
            id: toastId,
            title: "Upload successful!",
            description: "Your document is ready for analysis.",
          });
        });
      }
    );
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
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
                <Button variant="ghost" className="font-medium" asChild><Link to="/dashboard">Dashboard</Link></Button>
                <Button variant="ghost" asChild><Link to="/chat">Chat</Link></Button>
                <Button variant="ghost" asChild><Link to="/analytics">Analytics</Link></Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 pl-4 border-l border-border cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-metro-blue/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-metro-blue" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold">Welcome back, {user?.displayName || 'User'}</h2>
          <p className="text-muted-foreground">Here's what's happening with your documents today.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.label} whileHover={{ scale: 1.02 }} className="card-glow">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="p-8 glass-effect border-2 border-dashed border-primary/30 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={handleUploadClick}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <motion.div whileHover={{ scale: 1.05 }} className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Upload New Document</h3>
                <p className="text-muted-foreground mt-2">
                  Drag and drop your files here, or click to browse
                </p>
              </div>
              <Button variant="metro" size="lg"> Choose Files </Button>
            </motion.div>
          </Card>
        </motion.div>

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

          {loading ? (
             <div className="flex justify-center items-center h-40">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase())).map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
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
                              <span>{formatFileSize(doc.size)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{doc.uploadedAt ? formatDistanceToNow(doc.uploadedAt.toDate()) : 'N/A'} ago</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge
                            variant={doc.status === 'analyzed' ? 'default' : doc.status === 'processing' ? 'secondary' : 'destructive'}
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
                          {doc.insights && doc.insights > 0 ? `${doc.insights} AI insights available` : 'No insights yet'}
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
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;