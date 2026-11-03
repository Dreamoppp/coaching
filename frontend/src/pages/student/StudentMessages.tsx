import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card } from '../../components/common/Card';
import { MessageSquare, Send, Users, User } from 'lucide-react';
import { Conversation, Message } from '../../types';

export const StudentMessages: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !activeConversation) {
        setActiveConversation(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      if (socket) {
        socket.emit('join_conversation', activeConversation.id);
      }
    }

    return () => {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation.id);
      }
    };
  }, [activeConversation, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (msg: Message) => {
        if (msg.conversationId === activeConversation?.id) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        }
      });
      return () => {
        socket.off('new_message');
      };
    }
  }, [socket, activeConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const content = inputMessage.trim();
    setInputMessage('');

    try {
      if (socket && isConnected) {
        socket.emit('send_message', {
          conversationId: activeConversation.id,
          content,
        });
      } else {
        const res = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
          content,
        });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Faculty Doubt Clearing Hub</h1>
        <p className="text-xs text-slate-500">Live discussion with subject teachers and batch peers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[72vh]">
        <Card className="md:col-span-4 p-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Channels</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Connected
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-indigo-50/80 border border-indigo-200 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    conv.type === 'BATCH_GROUP' ? 'bg-indigo-600 text-white' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {conv.type === 'BATCH_GROUP' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{conv.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.content || 'Open chat'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="md:col-span-8 flex flex-col h-full overflow-hidden">
          {activeConversation ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {activeConversation.type === 'BATCH_GROUP' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{activeConversation.title}</h3>
                  <p className="text-[10px] text-slate-400">Direct Faculty Forum</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#f8fafc]/50">
                {messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <img
                        src={m.sender?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.sender?.name}`}
                        alt={m.sender?.name}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 mt-1"
                      />
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-2 text-[10px] ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-slate-700">{m.sender?.name}</span>
                          <span className="text-slate-400">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about homework or concepts..."
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select a channel to begin chat.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

