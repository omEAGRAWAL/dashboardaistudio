'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { MessageSquare, Send, Search, Phone, User, ExternalLink } from 'lucide-react';

interface WaMessage {
  id: string;
  orgId: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  customerPhone: string;
  sentAt: Timestamp | null;
  twilioSid?: string;
}

interface Conversation {
  id: string;
  orgId: string;
  customerPhone: string;
  currentStep: number;
  responses: Record<string, string>;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  leadId?: string;
}

function formatTime(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function WhatsAppInboxPage() {
  const { user, orgId, role, loading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!orgId && role !== 'superadmin') return;
    const q = orgId
      ? query(
          collection(db, 'conversations'),
          where('orgId', '==', orgId),
          orderBy('updatedAt', 'desc')
        )
      : query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setConversations(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation))
      );
    });
  }, [orgId, role]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    const q = query(
      collection(db, 'whatsapp_messages'),
      where('conversationId', '==', selectedConvId),
      orderBy('sentAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WaMessage)));
    });
  }, [selectedConvId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConv || !orgId) return;
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          to: selectedConv.customerPhone,
          body: messageText.trim(),
          conversationId: selectedConvId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
      } else {
        setMessageText('');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.customerPhone.includes(searchQuery) ||
    Object.values(c.responses || {}).some((v) =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 flex overflow-hidden">

          {/* Conversation list */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-green-600" />
                WhatsApp Inbox
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by phone or name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No conversations yet.
                  <br />
                  They appear here when customers message your WhatsApp number.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const customerName = conv.responses?.name || conv.customerPhone;
                  const isSelected = conv.id === selectedConvId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-green-50 border-r-2 border-green-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {customerName}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0 ml-1">
                              {formatTime(conv.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-500 truncate">{conv.customerPhone}</span>
                            <span
                              className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                                conv.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : conv.status === 'active'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {conv.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedConv.responses?.name || selectedConv.customerPhone}
                      </div>
                      <div className="text-xs text-gray-400">{selectedConv.customerPhone}</div>
                    </div>
                  </div>
                  {selectedConv.leadId && (
                    <a
                      href="/"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-3 py-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Lead
                    </a>
                  )}
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-2"
                  style={{ background: '#e5ddd5' }}
                >
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-8">
                      No messages yet in this conversation.
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-sm px-3 py-2 rounded-lg text-sm shadow-sm ${
                          msg.direction === 'outbound'
                            ? 'bg-[#dcf8c6] rounded-tr-none text-gray-800'
                            : 'bg-white rounded-tl-none text-gray-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <div className="text-xs text-gray-400 text-right mt-1">
                          {formatTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose area */}
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3">
                  <textarea
                    rows={1}
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !messageText.trim()}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl p-2.5 transition-colors"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
