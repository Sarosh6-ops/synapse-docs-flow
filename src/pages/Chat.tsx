import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  Send,
  Bot,
  User,
  FileText,
  Clock,
  Users,
  Search,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/types';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    await addDoc(collection(db, 'messages'), {
      sender: user.displayName || user.email,
      senderId: user.uid,
      content: message,
      timestamp: serverTimestamp(),
    });

    setMessage('');
  };

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp.toDate());
  };

  const onlineUsers = [
    { name: 'Arjun Nair', status: 'online', avatar: 'AN' },
    { name: 'Priya Sharma', status: 'online', avatar: 'PS' },
    { name: 'Rajesh Kumar', status: 'away', avatar: 'RK' },
    { name: 'AI Assistant', status: 'online', avatar: 'AI' }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-80 border-r border-border bg-card/30 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">Collaboration Hub</h2>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-input/50"
            />
          </div>
        </div>

        {/* Online Users */}
        <div className="p-6 space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Online Now ({onlineUsers.filter(u => u.status === 'online').length})
          </h3>
          <div className="space-y-3">
            {onlineUsers.map((user, index) => (
              <motion.div
                key={user.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={user.name === 'AI Assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    user.status === 'online' ? 'bg-success' : 'bg-warning'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                </div>
                {user.name !== 'Arjun Nair' && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Video className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="p-6 border-t border-border">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Recent Documents
          </h3>
          <div className="space-y-3">
            {[
              'Metro Extension Proposal',
              'Safety Report Q4',
              'Equipment Invoice'
            ].map((doc, index) => (
              <motion.div
                key={doc}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm truncate">{doc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 border-b border-border bg-card/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Team Collaboration</h1>
              <p className="text-sm text-muted-foreground">
                Metro Extension Project Discussion
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <Users className="h-3 w-3 mr-1" />
                4 online
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-start space-x-3 ${
                  msg.senderId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={
                    msg.isBot 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.isSystem 
                      ? 'bg-muted text-muted-foreground'
                      : msg.senderId === user?.uid
                      ? 'bg-metro-blue text-primary-foreground'
                      : 'bg-muted'
                  }>
                    {msg.isBot ? (
                      <Bot className="h-4 w-4" />
                    ) : msg.isSystem ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      msg.sender.split(' ').map(n => n[0]).join('')
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className={`flex-1 max-w-lg ${
                  msg.senderId === user?.uid ? 'text-right' : ''
                }`}>
                  <div className={`rounded-lg p-4 ${
                    msg.isSystem
                      ? 'bg-muted/50 border border-border text-center italic'
                      : msg.isBot
                      ? 'bg-primary/10 border border-primary/20'
                      : msg.senderId === user?.uid
                      ? 'metro-gradient text-primary-foreground'
                      : 'bg-card-elevated border border-border/50'
                  }`}>
                    {!msg.isSystem && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium opacity-80">{msg.sender}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 border-t border-border bg-card/30 backdrop-blur-sm"
        >
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-input/50"
            />
            <Button type="submit" variant="metro" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI assistant is active and ready to help with document analysis
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;