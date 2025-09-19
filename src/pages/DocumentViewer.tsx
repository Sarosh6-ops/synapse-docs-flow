import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Archive, ArrowLeft, Download, Share2, FileText, Brain, AlertTriangle, CheckCircle,
  Clock, User, Zap, Eye, MessageSquare, TrendingUp, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { Document as DocumentType } from '@/types';

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    setIsLoading(true);
    const docRef = doc(db, 'documents', documentId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setDocument({ id: doc.id, ...doc.data() } as DocumentType);
      } else {
        toast({ title: "Error", description: "Document not found.", variant: "destructive" });
        navigate('/dashboard');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [documentId, navigate, toast]);

  useEffect(() => {
    if (document?.storagePath) {
      const fileRef = ref(storage, document.storagePath);
      getDownloadURL(fileRef)
        .then(url => setDownloadUrl(url))
        .catch(error => console.error("Error getting download URL:", error));
    }
  }, [document]);

  const handleDownload = () => {
    if (downloadUrl && document) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank'; // Open in new tab is safer for various file types
      link.download = document.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({ title: "Download Not Ready", description: "The download link is being prepared. Please wait.", variant: "destructive" });
    }
  };

  const handleArchive = async () => {
    if (!documentId) return;
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, { status: 'archived' });
      toast({ title: "Document Archived", description: `${document?.title} has been moved to the archive.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not archive the document.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: DocumentType['status']) => {
    switch (status) {
      case 'analyzed': return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Analyzed</Badge>;
      case 'processing': return <Badge variant="secondary" className="animate-pulse"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'archived': return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
      case 'failed': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-1/2 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!document) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Document not found.</motion.div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-screen bg-background">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
              <div>
                <h1 className="text-xl font-bold truncate" title={document.title}>{document.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1"><FileText className="h-3 w-3" /><span>{document.type}</span></span>
                  <span>{document.size}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(document.status)}
              {document.aiScore && (<div className="flex items-center space-x-1 text-sm"><Zap className="h-4 w-4 text-primary" /><span className="font-medium">{document.aiScore}%</span></div>)}
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="container mx-auto px-6 py-3 border-b border-border bg-card/20">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold mr-4">Quick Actions:</h3>
          <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><Share2 className="h-4 w-4 mr-2" />Share</Button></DialogTrigger><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Share Document</DialogTitle><DialogDescription>Share this document with others. They will receive a link to view it.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" defaultValue="team@example.com" className="col-span-3" /></div></div><DialogFooter><Button type="submit" onClick={() => toast({ title: "Shared!", description: "The document has been shared."})}>Share</Button></DialogFooter></DialogContent></Dialog>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!downloadUrl}><Download className="h-4 w-4 mr-2" />Download</Button>
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={document.status === 'archived'}><Archive className="h-4 w-4 mr-2" />{document.status === 'archived' ? 'Archived' : 'Archive'}</Button>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-2">
            <Card className="p-8 glass-effect border border-border/50 h-full">
              <h3 className="text-lg font-semibold mb-4">Document Preview</h3>
              <div className="prose prose-invert max-w-none rounded-lg bg-muted/30 p-4 h-[60vh] overflow-auto">
                {document.summary ? <p>{document.summary}</p> : <p>No preview available. AI analysis may be in progress or has failed.</p>}
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
            <Card className="p-6 glass-effect border border-primary/20">
              <div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 rounded-lg metro-gradient flex items-center justify-center"><Brain className="h-5 w-5 text-primary-foreground" /></div><div><h3 className="font-semibold text-lg">AI Analysis</h3></div></div>
              {document.aiScore && (<div className="flex items-center space-x-2"><div className="flex-1 bg-secondary rounded-full h-2"><motion.div initial={{ width: 0 }} animate={{ width: `${document.aiScore}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full metro-gradient rounded-full" /></div><span className="text-sm font-medium">{document.aiScore}%</span></div>)}
            </Card>
            <Card className="glass-effect border border-border/50">
              <Tabs defaultValue="summary" className="p-6">
                <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="actions">Actions</TabsTrigger><TabsTrigger value="alerts">Alerts</TabsTrigger></TabsList>
                <TabsContent value="summary" className="space-y-4 mt-6"><h4 className="font-semibold mb-2">AI Summary</h4><p className="text-sm text-muted-foreground leading-relaxed">{document.summary || "No summary available."}</p><h4 className="font-semibold mb-3 mt-4">Key Points</h4><ul className="space-y-2">{document.keyPoints?.map((point, index) => (<motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }} className="flex items-start space-x-2 text-sm"><CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /><span>{point}</span></motion.li>)) || <li>No key points identified.</li>}</ul></TabsContent>
                <TabsContent value="actions" className="space-y-4 mt-6"><h4 className="font-semibold">Action Items</h4><div className="space-y-3">{document.actionItems?.map((action, index) => (<motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }} className="p-3 rounded-lg border border-border/50 bg-card-elevated/50"><div className="flex items-start justify-between mb-2"><Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">{action.priority}</Badge></div><p className="text-sm font-medium mb-1">{action.item}</p><p className="text-xs text-muted-foreground">{action.department}</p></motion.div>)) || <p>No action items found.</p>}</div></TabsContent>
                <TabsContent value="alerts" className="space-y-4 mt-6"><h4 className="font-semibold">Alerts & Notifications</h4><div className="space-y-3">{document.alerts?.map((alert, index) => (<motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }} className={`p-3 rounded-lg border ${alert.type === 'warning' ? 'border-warning/50 bg-warning/5' : 'border-primary/50 bg-primary/5'}`}><div className="flex items-start space-x-2">{alert.type === 'warning' ? (<AlertTriangle className="h-4 w-4 text-warning mt-0.5" />) : (<Eye className="h-4 w-4 text-primary mt-0.5" />)}<p className="text-sm">{alert.message}</p></div></motion.div>)) || <p>No alerts found.</p>}</div></TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentViewer;