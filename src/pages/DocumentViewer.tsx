import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Zap,
  Eye,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { db, functions } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Document as DocumentType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'documents', documentId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() } as DocumentType;
        setDocument(docData);
      } else {
        console.log("No such document!");
        setDocument(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [documentId]);

  const handleAnalyze = async () => {
      if (!documentId) return;
      setIsAnalyzing(true);
      toast({title: "AI Analysis Started", description: "The AI is now analyzing your document."})
      try {
          const analyzeDocument = httpsCallable(functions, 'analyzeDocument');
          await analyzeDocument({ documentId });
          toast({title: "Analysis Complete", description: "AI insights are now available."})
      } catch (error) {
          console.error("Error analyzing document:", error);
          toast({title: "Analysis Failed", description: "Could not analyze the document.", variant: "destructive"})
      } finally {
          setIsAnalyzing(false);
      }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

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

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">Document not found</h2>
          <p className="text-muted-foreground">The document you are looking for does not exist.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{document.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{document.type}</span>
                  </span>
                  <span>{formatFileSize(document.size)}</span>
                  <span className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>by {user?.displayName || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{document.uploadedAt ? formatDistanceToNow(document.uploadedAt.toDate()) : 'N/A'} ago</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant={document.status === 'analyzed' ? 'default' : document.status === 'processing' ? 'secondary' : 'destructive'} className={document.status === 'analyzed' ? 'bg-success text-success-foreground' : ''}>
                {document.status === 'processing' ? <motion.div animate={{rotate:360}} transition={{duration:1, repeat:Infinity, ease:'linear'}} className="w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1"/> : <CheckCircle className="h-3 w-3 mr-1" />}
                {document.status}
              </Badge>
              {document.aiScore && (
                <div className="flex items-center space-x-1 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">{document.aiScore}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="p-8 glass-effect border border-border/50">
                <div className="prose prose-invert max-w-none">
                    <iframe src={document.downloadUrl} className="w-full h-[800px]" title={document.title} />
                </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {document.status === 'uploaded' && (
                <Card className="p-6 text-center">
                    <h3 className="font-semibold mb-2">AI Analysis Ready</h3>
                    <p className="text-sm text-muted-foreground mb-4">This document has not been analyzed yet.</p>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                        {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                    </Button>
                </Card>
            )}
            {document.status === 'processing' && (
                <Card className="p-6 text-center">
                    <h3 className="font-semibold mb-2">AI Analysis in Progress</h3>
                    <p className="text-sm text-muted-foreground">The AI is currently analyzing the document. This may take a moment.</p>
                </Card>
            )}

            {document.status === 'analyzed' && (
              <>
                <Card className="p-6 glass-effect border border-primary/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg metro-gradient flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI Analysis</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${document.aiScore || 0}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full metro-gradient rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium">{document.aiScore || 0}%</span>
                  </div>
                </Card>

                <Card className="glass-effect border border-border/50">
                  <Tabs defaultValue="summary" className="p-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                      <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4 mt-6">
                      <div>
                        <h4 className="font-semibold mb-2">Executive Summary</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {document.aiSummary}
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="actions" className="space-y-4 mt-6">
                      <h4 className="font-semibold">Action Items</h4>
                      <ul className="space-y-2">
                        {document.actionItems?.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="alerts" className="space-y-4 mt-6">
                      <h4 className="font-semibold">Alerts & Notifications</h4>
                      <ul className="space-y-2">
                        {document.alerts?.map((alert, index) => (
                           <li key={index} className="flex items-start space-x-2 text-sm">
                           <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                           <span>{alert}</span>
                         </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;