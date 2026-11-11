import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronRight,
  Headphones,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../services/api';

const API_BASE = 'http://localhost:5000/api/admin/support';

export const SupportHelpdeskPage: React.FC = () => {
  const user = getStoredUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // New ticket modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'GENERAL_INQUIRY' | 'PAYMENT_ISSUE' | 'KYC_QUERY' | 'TECHNICAL_BUG'>('GENERAL_INQUIRY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Chat Reply state
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMemberTickets = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/member/tickets?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setTickets(json.data);
          // If a ticket is currently open in chat, update it
          if (selectedTicket) {
            const fresh = json.data.find((t: any) => t._id === selectedTicket._id);
            if (fresh) setSelectedTicket(fresh);
          } else if (json.data.length > 0 && !selectedTicket) {
            setSelectedTicket(json.data[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberTickets();
    // Live chat polling every 2.5 seconds so customer gets Admin replies in real-time
    const interval = setInterval(loadMemberTickets, 2500);
    return () => clearInterval(interval);
  }, [user?.email, selectedTicket?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/member/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: user?.email,
          memberName: user?.fullName || 'FIC Member',
          memberPhone: user?.phoneNumber || user?.mobileNumber || '',
          subject: subject.trim(),
          category,
          priority,
          message: initialMessage.trim()
        })
      });

      if (res.ok) {
        const json = await res.json();
        setSubject('');
        setInitialMessage('');
        setShowNewModal(false);
        await loadMemberTickets();
        if (json.data) setSelectedTicket(json.data);
      } else {
        alert('Failed to submit support request. Please try again.');
      }
    } catch (err: any) {
      alert(`Error creating ticket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !chatMessage.trim()) return;

    setIsSendingMsg(true);
    try {
      const res = await fetch(`${API_BASE}/member/tickets/${selectedTicket._id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: user?.fullName || 'Customer',
          message: chatMessage.trim()
        })
      });

      if (res.ok) {
        setChatMessage('');
        await loadMemberTickets();
      }
    } catch (err: any) {
      alert(`Failed to deliver message: ${err.message}`);
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#FAF7F2] to-[#F5EBDD] p-6 rounded-3xl border border-[#EDE2D7] shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8064B1]/10 text-[#8064B1] text-xs font-bold border border-[#8064B1]/20">
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 Desk Assistance & Real-time Live Resolution</span>
          </div>
          <h1 className="text-2xl font-black text-[#29302D] tracking-tight">Help & Support Desk</h1>
          <p className="text-xs text-[#77786E] max-w-xl">
            Have a question, technical issue, or payment enquiry? Send a message directly to our dedicated FIC administrative operations team.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#C66B52] hover:bg-[#b05d45] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask or Raise Enquiry</span>
        </button>
      </div>

      {/* Main Support Workspace: Tickets Queue + Real-Time Live Chat Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left: Support Queries Queue */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EDE2D7] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#EDE2D7] bg-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#C66B52]" />
              <span className="text-xs font-bold text-[#29302D] uppercase tracking-wider">
                My Support Inquiries ({tickets.length})
              </span>
            </div>
            <button
              onClick={loadMemberTickets}
              title="Refresh tickets"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#EDE2D7]">
            {loading && tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#77786E]">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <LifeBuoy className="w-10 h-10 text-[#DDD4C7] mx-auto" />
                <h3 className="text-sm font-bold text-[#29302D]">No inquiries submitted yet</h3>
                <p className="text-xs text-[#77786E] max-w-xs mx-auto">
                  Click the "Ask or Raise Enquiry" button above to submit your question directly to FIC Admin.
                </p>
              </div>
            ) : (
              tickets.map((t, idx) => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <div
                    key={t._id || idx}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FAF7F2] border-l-4 border-[#C66B52]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#8064B1]">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#29302D] line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-[#77786E] mt-1 line-clamp-1">
                      {t.messages?.[t.messages.length - 1]?.message || 'No messages'}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#9E95A8] font-mono">
                      <span>{t.category?.replace('_', ' ')}</span>
                      <span>{new Date(t.updatedAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Chat / Ticket Thread Window */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EDE2D7] shadow-sm flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-[#FAF7F2] border-b border-[#EDE2D7] flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#8064B1]">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-[11px] text-[#77786E]">• {selectedTicket.category?.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#29302D] mt-0.5">{selectedTicket.subject}</h3>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedTicket.status === 'IN_PROGRESS'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed / Resolved</span>
                      </>
                    ) : (
                      <span>{selectedTicket.status}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Resolution Banner when Completed */}
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2 px-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>This inquiry has been completed & resolved by the FIC Admin Desk.</strong> If you still have questions, you can continue replying below to reopen the conversation.
                    </span>
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#FCFAF7] min-h-[350px]">
                {selectedTicket.messages?.map((msg: any, i: number) => {
                  const isAdmin = msg.sender === 'ADMIN';
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <span className="text-[10px] text-[#9E95A8] mb-1 font-mono">
                        {isAdmin ? 'FIC Administration' : 'You'} •{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isAdmin
                            ? 'bg-white text-[#29302D] border border-[#EDE2D7] rounded-tl-none shadow-sm'
                            : 'bg-[#C66B52] text-white rounded-tr-none shadow-md'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#EDE2D7]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message to the support admin..."
                    className="flex-1 text-xs px-4 py-3 bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl text-[#29302D] placeholder-[#9E95A8] focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMsg || !chatMessage.trim()}
                    className="px-4 py-3 bg-[#C66B52] hover:bg-[#b05d45] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#77786E]">
              <LifeBuoy className="w-12 h-12 text-[#DDD4C7] mb-3" />
              <h4 className="text-sm font-bold text-[#29302D]">Select or Submit an Inquiry</h4>
              <p className="text-xs text-[#77786E] mt-1 max-w-sm">
                Pick an existing ticket on the left or raise a new request to start live chat with FIC Admin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Raise New Inquiry / Complaint */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-50 bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#EDE2D7]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#EDE2D7]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C66B52]/10 text-[#C66B52] flex items-center justify-center">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-[#29302D] text-base">Submit Support Request</h3>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#29302D] uppercase mb-1">
                    Subject / Concern Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question regarding service listing approval timeline"
                    className="w-full text-xs p-3 border border-[#DDD4C7] bg-[#FAF7F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#29302D] uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full text-xs p-3 border border-[#DDD4C7] bg-[#FAF7F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                    >
                      <option value="GENERAL_INQUIRY">General Inquiry</option>
                      <option value="PAYMENT_ISSUE">Payment & Billing</option>
                      <option value="KYC_QUERY">KYC Verification</option>
                      <option value="TECHNICAL_BUG">Technical Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#29302D] uppercase mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full text-xs p-3 border border-[#DDD4C7] bg-[#FAF7F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#29302D] uppercase mb-1">
                    Detailed Message / Complaint Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail so our admin team can assist and resolve it immediately..."
                    className="w-full text-xs p-3 border border-[#DDD4C7] bg-[#FAF7F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C66B52]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[#EDE2D7]">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border border-[#DDD4C7] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#C66B52] hover:bg-[#b05d45] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit to Admin Desk'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

