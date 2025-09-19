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
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Document as DocumentType, AiInsights } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() } as DocumentType;
        setDocument(docData);

        if (docData.downloadUrl) {
            try {
                const response = await fetch(docData.downloadUrl);
                const text = await response.text();
                setDocument(prevDoc => prevDoc ? { ...prevDoc, content: text } : null);
            } catch (error) {
                console.error("Error fetching document content:", error);
                setDocument(prevDoc => prevDoc ? { ...prevDoc, content: "Could not load document content." } : null);
            }
        }
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchDocument();
  }, [documentId]);

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

  // Placeholder for AI Insights as it's not in the main document now
  const aiInsights: AiInsights | null = document.aiSummary ? {
    summary: document.aiSummary,
    keyPoints: ["Point 1 from AI", "Point 2 from AI"],
    actionItems: [],
    alerts: [],
    confidence: document.aiScore || 0,
    processingTime: "N/A"
  } : null;

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
              <Badge variant={document.status === 'analyzed' ? 'default' : 'secondary'} className={document.status === 'analyzed' ? 'bg-success text-success-foreground' : ''}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {document.status}
              </Badge>
              {document.aiScore && (
                <div className="flex items-center space-x-1 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">{document.aiScore}%</span>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Share2 className="h-3 w-3 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={document.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Document Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="p-8 glass-effect border border-border/50">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-line text-foreground leading-relaxed">
                  {document.content || "Loading document content..."}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {aiInsights ? (
              <>
                <Card className="p-6 glass-effect border border-primary/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg metro-gradient flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI Analysis</h3>
                      <p className="text-xs text-muted-foreground">
                        Processed in {aiInsights.processingTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${aiInsights.confidence}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full metro-gradient rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium">{aiInsights.confidence}%</span>
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
                          {aiInsights.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Key Points</h4>
                        <ul className="space-y-2">
                          {aiInsights.keyPoints.map((point, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                              className="flex items-start space-x-2 text-sm"
                            >
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </>
            ) : (
                <Card className="p-8 glass-effect border border-border/50 text-center">
                    <p className="text-muted-foreground">
                        {document.status === 'processing' ? 'AI insights are being generated...' : 'No AI insights available for this document.'}
                    </p>
                </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6 glass-effect border border-border/50">
              <h4 className="font-semibold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discuss in Chat
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with Team
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;