import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock document data
  const document = {
    id: documentId,
    title: 'Metro Line Extension Proposal',
    type: 'PDF',
    size: '2.4 MB',
    uploadedAt: '2 hours ago',
    uploadedBy: 'Arjun Nair',
    status: 'analyzed',
    aiScore: 95,
    content: `
      KOCHI METRO RAIL LIMITED
      
      METRO LINE EXTENSION PROPOSAL
      Phase 3 Development Plan
      
      Executive Summary:
      This document outlines the proposed extension of the Kochi Metro Rail system to connect additional areas of the city, improving public transportation coverage and reducing traffic congestion.
      
      Key Objectives:
      1. Extend Line 1 to cover Kakkanad IT Hub
      2. Add 8 new stations with modern facilities
      3. Implement smart ticketing across all stations
      4. Ensure environmental compliance
      
      Budget Allocation:
      Total Project Cost: ₹2,450 Crores
      Central Government: ₹1,200 Crores (49%)
      State Government: ₹850 Crores (35%)
      KMRL Internal: ₹400 Crores (16%)
      
      Timeline:
      Phase 1: Land acquisition (6 months)
      Phase 2: Construction (24 months)
      Phase 3: Testing & Commissioning (6 months)
      Total Duration: 36 months
    `
  };

  const aiInsights = {
    summary: "This document presents a comprehensive metro line extension proposal with clear financial planning and realistic timelines. The project shows strong potential for improving urban connectivity.",
    keyPoints: [
      "₹2,450 Crores total budget allocation with diversified funding sources",
      "Strategic focus on Kakkanad IT Hub connectivity to boost tech sector accessibility",
      "36-month timeline includes proper phases for land acquisition and testing",
      "Environmental compliance measures integrated into planning phase"
    ],
    actionItems: [
      {
        priority: 'high',
        item: 'Secure land acquisition approvals within 6 months',
        department: 'Legal & Planning'
      },
      {
        priority: 'medium',
        item: 'Finalize environmental impact assessment',
        department: 'Environmental Affairs'
      },
      {
        priority: 'high',
        item: 'Confirm funding agreements with central and state governments',
        department: 'Finance'
      }
    ],
    alerts: [
      {
        type: 'warning',
        message: 'Land acquisition timeline may face delays due to regulatory approvals'
      },
      {
        type: 'info',
        message: 'Environmental clearance required before Phase 2 commencement'
      }
    ],
    confidence: 95,
    processingTime: '0.8 seconds'
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
                  <span>{document.size}</span>
                  <span className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>by {document.uploadedBy}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{document.uploadedAt}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Analyzed
              </Badge>
              <div className="flex items-center space-x-1 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">{document.aiScore}%</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Share', description: 'Share functionality would be implemented here.' })}>
                <Share2 className="h-3 w-3 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Download', description: 'Download functionality would be implemented here.' })}>
                <Download className="h-3 w-3 mr-2" />
                Download
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
                  {document.content}
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
            {/* AI Analysis Header */}
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

            {/* AI Insights Tabs */}
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

                <TabsContent value="actions" className="space-y-4 mt-6">
                  <h4 className="font-semibold">Action Items</h4>
                  <div className="space-y-3">
                    {aiInsights.actionItems.map((action, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        className="p-3 rounded-lg border border-border/50 bg-card-elevated/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge 
                            variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {action.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{action.item}</p>
                        <p className="text-xs text-muted-foreground">{action.department}</p>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4 mt-6">
                  <h4 className="font-semibold">Alerts & Notifications</h4>
                  <div className="space-y-3">
                    {aiInsights.alerts.map((alert, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          alert.type === 'warning' 
                            ? 'border-warning/50 bg-warning/5' 
                            : 'border-primary/50 bg-primary/5'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {alert.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                          ) : (
                            <Eye className="h-4 w-4 text-primary mt-0.5" />
                          )}
                          <p className="text-sm">{alert.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 glass-effect border border-border/50">
              <h4 className="font-semibold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => toast({ title: 'Discuss in Chat', description: 'Chat functionality would be implemented here.' })}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discuss in Chat
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => toast({ title: 'Generate Report', description: 'Report generation functionality would be implemented here.' })}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => toast({ title: 'Share with Team', description: 'Sharing functionality would be implemented here.' })}>
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