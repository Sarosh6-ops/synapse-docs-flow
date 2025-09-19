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
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

// Mock data for chat rooms/contacts
const chatRooms = [
    { id: 'general', name: 'Team Collaboration', description: 'Metro Extension Project' },
    { id: 'safety-q4', name: 'Safety Report Q4', description: 'Compliance Discussion' },
    { id: 'budget-2024', name: 'Budget 2024', description: 'Financial Planning' },
];

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
        collection(db, 'messages'),
        where('chatId', '==', activeChatId),
        orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !activeChatId) return;

    await addDoc(collection(db, 'messages'), {
      chatId: activeChatId,
      sender: user.displayName || user.email,
      senderId: user.uid,
      content: message,
      timestamp: serverTimestamp(),
    });

    setMessage('');
  };

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '...';
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(timestamp.toDate());
  };

  const activeChat = chatRooms.find(room => room.id === activeChatId);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col"
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10 bg-input/50" />
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide px-2">
                Channels
            </h3>
            {chatRooms.map((room) => (
                <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setActiveChatId(room.id)}
                    className={cn(
                        "p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                        activeChatId === room.id && "bg-muted"
                    )}
                >
                    <p className="font-semibold text-sm">{room.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{room.description}</p>
                </motion.div>
            ))}
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
              <h1 className="text-xl font-bold">{activeChat?.name || 'Select a Chat'}</h1>
              <p className="text-sm text-muted-foreground">
                {activeChat?.description || 'No chat selected'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <Users className="h-3 w-3 mr-1" />
                {messages.length > 0 ? [...new Set(messages.map(m => m.senderId))].length : 0} online
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start space-x-3 ${
                  msg.senderId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={cn(
                      "bg-muted",
                      msg.isBot && 'bg-primary text-primary-foreground',
                      msg.senderId === user?.uid && 'bg-metro-blue text-primary-foreground'
                  )}>
                    {msg.isBot ? <Bot className="h-4 w-4" /> : msg.sender.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-lg ${ msg.senderId === user?.uid ? 'text-right' : '' }`}>
                  <div className={cn(
                      "rounded-lg p-4",
                      msg.isSystem ? 'bg-muted/50 border border-border text-center italic' :
                      msg.isBot ? 'bg-primary/10 border border-primary/20' :
                      msg.senderId === user?.uid ? 'metro-gradient text-primary-foreground' :
                      'bg-card-elevated border border-border/50'
                  )}>
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
              disabled={!activeChatId}
            />
            <Button type="submit" variant="metro" size="icon" disabled={!message.trim() || !activeChatId}>
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