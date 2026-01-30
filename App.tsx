import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, BookOpen, ChevronLeft, LayoutGrid, User, Calendar, Save, ArrowRightCircle, Download, Check, AlertTriangle, X, Bot, Lock, Cloud, Globe, ArrowRight, Sun, MessageCircle, Paperclip, FileText, Image as ImageIcon, Send, Loader2, LockOpen, LogOut, KeyRound, Mail, UserPlus } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, SchoolClass, ChatMessage } from './types';
import AIChat from './components/AIChat';
import { shareClass, getClass, sendMessage, deleteMessage, toggleChatLock, loginUser, signupUser } from './services/api';

const SAMPLE_STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Patel', rollNo: '01' },
  { id: '2', name: 'Bianca Rossi', rollNo: '02' },
  { id: '3', name: 'Charlie Davis', rollNo: '03' },
  { id: '4', name: 'Diya Sharma', rollNo: '04' },
  { id: '5', name: 'Ethan Hunt', rollNo: '05' },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- INTERNAL COMPONENTS ---

const LoginPage = ({ 
  onLogin
}: { 
  onLogin: (email: string, password: string) => Promise<string | undefined>; 
}) => {
  const [isSignup, setIsSignup] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password) return;
    if (isSignup && !name) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignup) {
        const result = await signupUser(name, email, password);
        if (result.success) {
          setSuccessMsg('Account created! Please log in.');
          setIsSignup(false);
          setPassword(''); // clear password for safety
        } else {
          setError(result.error || "Signup failed");
        }
      } else {
        // Login
        const errorMsg = await onLogin(email, password);
        if (errorMsg) {
          setError(errorMsg);
        }
      }
    } catch (e) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, #444 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="bg-paper border-2 border-stone-800 rounded-2xl shadow-[12px_12px_0px_rgba(0,0,0,0.15)] w-full max-w-md p-0 relative z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-ink-blue p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-ink-blue shadow-lg">
             <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold font-hand mb-1 tracking-wider">Class Register</h1>
          <p className="text-blue-100 text-sm">Digital Attendance & Chat</p>
        </div>

        {/* Content */}
        <div className="p-8 bg-white flex-1">
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                {isSignup ? <UserPlus size={24} className="text-ink-blue"/> : <KeyRound size={24} className="text-ink-blue"/>}
                {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
               {isSignup && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-stone-400" size={18} />
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe" 
                            className="w-full p-2.5 pl-10 border-2 border-stone-200 rounded-lg focus:border-ink-blue focus:outline-none transition-colors"
                        />
                    </div>
                  </div>
               )}
               
               <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" 
                        className="w-full p-2.5 pl-10 border-2 border-stone-200 rounded-lg focus:border-ink-blue focus:outline-none transition-colors"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        placeholder="••••••••" 
                        className="w-full p-2.5 pl-10 border-2 border-stone-200 rounded-lg focus:border-ink-blue focus:outline-none transition-colors"
                    />
                  </div>
               </div>
               
               {error && (
                 <div className="text-red-600 text-sm bg-red-50 p-3 rounded flex items-center gap-2">
                   <AlertTriangle size={16} /> {error}
                 </div>
               )}
               
               {successMsg && (
                 <div className="text-green-600 text-sm bg-green-50 p-3 rounded flex items-center gap-2">
                   <Check size={16} /> {successMsg}
                 </div>
               )}

               <button 
                 onClick={handleAuth}
                 disabled={loading || !email || !password || (isSignup && !name)}
                 className="w-full bg-ink-blue text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 mt-2"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : (isSignup ? 'Sign Up' : 'Login')}
               </button>
               
               <div className="text-center pt-2">
                 <button 
                    onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-stone-500 hover:text-ink-blue underline"
                 >
                    {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                 </button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ChatInterface = ({ 
  schoolClass, 
  isTeacher,
  onClose 
}: { 
  schoolClass: SchoolClass; 
  isTeacher: boolean;
  onClose: () => void;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(schoolClass.messages || []);
  const [isLocked, setIsLocked] = useState(schoolClass.isChatLocked || false);
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate a persistent session ID for students to identify their own messages
  const [mySessionId] = useState(() => {
    if (isTeacher) return 'teacher';
    const stored = localStorage.getItem('student_session_id');
    if (stored) return stored;
    const newId = 'student_' + Date.now() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('student_session_id', newId);
    return newId;
  });

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      if (!schoolClass.shareCode) return;
      try {
        const updatedClass = await getClass(schoolClass.shareCode);
        
        // Update Lock State
        if (updatedClass.isChatLocked !== undefined) {
           setIsLocked(updatedClass.isChatLocked);
        }

        if (updatedClass.messages) {
          // Merge logic to avoid overwriting pending messages
          setMessages(prev => {
            const pending = prev.filter(m => m.isPending);
            const serverMessages = updatedClass.messages || [];
            // We append pending messages at the end to keep them visible
            // In a real app we would de-dupe by ID
            return [...serverMessages, ...pending];
          });
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    fetchMessages(); // Initial fetch
    pollingRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [schoolClass.shareCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (file?: { url: string, name: string, type: 'image' | 'file' }) => {
    if (!schoolClass.shareCode) return;
    if (!isTeacher && isLocked) {
        alert("Chat is currently locked by the teacher.");
        return;
    }
    if ((!inputText.trim() && !file)) return;

    const tempId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: tempId,
      senderId: mySessionId,
      senderName: isTeacher ? 'Teacher' : 'Student',
      content: inputText,
      timestamp: Date.now(),
      type: file ? file.type : 'text',
      fileUrl: file?.url,
      fileName: file?.name,
      isPending: true // Mark as pending for UI
    };

    // Optimistic Update
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      // Send to API (exclude isPending)
      const { isPending, ...messagePayload } = newMessage;
      await sendMessage(schoolClass.shareCode, messagePayload);
      
      // Update local state to remove pending status
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isPending: false } : m));
    } catch (e: any) {
      alert(e.message || "Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove failed message
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!schoolClass.shareCode || !confirm("Delete this message?")) return;
    
    // Optimistic update
    setMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      await deleteMessage(schoolClass.shareCode, msgId, mySessionId);
    } catch (e) {
      alert("Failed to delete message");
      // Revert is hard without re-fetch, polling will eventually fix it or we could undo here
    }
  };

  const handleToggleLock = async () => {
    if (!isTeacher || !schoolClass.shareCode) return;
    
    const newState = !isLocked;
    // Optimistic update
    setIsLocked(newState);

    try {
        await toggleChatLock(schoolClass.shareCode, newState, mySessionId);
    } catch (e) {
        setIsLocked(!newState); // Revert
        alert("Failed to update lock state");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit for this demo using Blobs
      alert("File too large. Max 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      handleSend({ url: base64, name: file.name, type });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isInputDisabled = !isTeacher && isLocked;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-ink-blue p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold">{schoolClass.name}</h3>
              <p className="text-xs opacity-80 flex items-center gap-1">
                 {isTeacher ? 'Chat with Class' : 'Chat with Teacher'}
                 {isLocked && <span className="bg-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-400/50">LOCKED</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && (
                <button 
                    onClick={handleToggleLock} 
                    className={`p-1.5 rounded transition-colors ${isLocked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}
                    title={isLocked ? "Unlock Chat" : "Lock Chat"}
                >
                    {isLocked ? <Lock size={18} /> : <LockOpen size={18} />}
                </button>
            )}
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 space-y-3 relative">
          {messages.length === 0 && (
            <p className="text-center text-stone-400 text-sm mt-10">No messages yet. Start the conversation!</p>
          )}
          
          {messages.map((msg) => {
             // Identify if the message is from "me" based on session ID
             const isMe = msg.senderId === mySessionId;
             // Teacher can delete any message, Student can only delete their own
             // Also cannot delete pending messages
             const canDelete = !msg.isPending && (isTeacher || isMe);
             
             return (
               <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative mb-4`}>
                 <div className={`max-w-[85%] p-3 rounded-xl shadow-sm relative transition-opacity ${msg.isPending ? 'opacity-70' : 'opacity-100'} ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-stone-800 rounded-bl-none'}`}>
                    
                    {/* Header: Name */}
                    {msg.senderId !== mySessionId && (
                       <p className={`text-xs font-bold mb-1 ${isMe ? 'text-blue-200' : 'text-blue-600'}`}>
                         {msg.senderName} 
                         {msg.senderId === 'teacher' ? ' (Teacher)' : ''}
                       </p>
                    )}
                    
                    {/* Content */}
                    {msg.type === 'text' && <p className="text-sm break-words">{msg.content}</p>}
                    
                    {msg.type === 'image' && (
                      <div className="mb-1">
                        <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-h-40 border-2 border-white/50" />
                      </div>
                    )}

                    {msg.type === 'file' && (
                      <a href={msg.fileUrl} download={msg.fileName} className={`flex items-center gap-2 text-sm underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}>
                        <FileText size={16} /> {msg.fileName}
                      </a>
                    )}
                    
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-stone-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {msg.isPending && (
                        <Loader2 size={12} className={`animate-spin ${isMe ? 'text-blue-200' : 'text-stone-400'}`} />
                      )}
                    </div>
                 </div>
                 
                 {/* Delete Button - Always Visible */}
                 {canDelete && (
                    <button 
                        onClick={() => handleDelete(msg.id)}
                        className={`absolute top-2 p-1.5 bg-stone-200 text-stone-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm
                            ${isMe ? '-left-10' : '-right-10'}
                        `}
                        title="Delete message"
                    >
                        <Trash2 size={14} />
                    </button>
                 )}
               </div>
             );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-3 bg-white border-t border-stone-200 flex gap-2 items-center relative ${isInputDisabled ? 'bg-stone-50' : ''}`}>
          {isInputDisabled && (
            <div className="absolute inset-0 bg-stone-100/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-xs font-bold border border-stone-300 flex items-center gap-2">
                    <Lock size={12} /> Chat is locked by teacher
                </span>
            </div>
          )}
          
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileUpload}
             disabled={isInputDisabled}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
            className="text-stone-400 hover:text-blue-600 p-2 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isInputDisabled ? "Chat locked" : "Type a message..."}
            disabled={isInputDisabled}
            className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isInputDisabled || (!inputText && !fileInputRef.current?.files?.length)}
            className="bg-ink-blue text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ 
  isOpen, 
  type,
  name, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  type: 'class' | 'student';
  name: string; 
  onClose: () => void; 
  onConfirm: () => void; 
}) => {
  if (!isOpen) return null;

  const title = type === 'class' ? 'Delete Class' : 'Remove Student';
  const message = type === 'class'
    ? <span>Are you sure you want to delete <span className="font-bold text-stone-900">"{name}"</span>?</span>
    : <span>Do you want to remove this student from the class?</span>;

  const warningText = type === 'class' 
    ? 'All student data and attendance records for this class will be permanently removed.'
    : 'This will remove this student from the register. Their attendance records will be lost.';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-stone-800 rounded-lg shadow-[8px_8px_0px_rgba(0,0,0,0.2)] w-full max-w-md p-6 relative font-sans">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-stone-900">{title}</h3>
        </div>
        
        <p className="text-stone-600 mb-2">
          {message}
        </p>
        <p className="text-stone-500 text-sm mb-6">
          {type === 'class' && "This action cannot be undone."} {warningText}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 shadow-sm transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            {type === 'class' ? 'Delete' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({
  isOpen,
  onClose,
  classData,
  onCodeGenerated
}: {
  isOpen: boolean;
  onClose: () => void;
  classData: SchoolClass;
  onCodeGenerated: (code: string) => void;
}) => {
  const [code, setCode] = useState<string | null>(classData.shareCode || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(classData.shareCode || null);
      setError(null);
    }
  }, [isOpen, classData.shareCode]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await shareClass(classData);
      setCode(result.code);
      onCodeGenerated(result.code);
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-stone-800 rounded-lg shadow-[8px_8px_0px_rgba(0,0,0,0.2)] w-full max-w-sm p-6 relative font-sans">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-blue">
            <Cloud size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">Share Register</h3>
          <p className="text-stone-600 text-sm mb-6">
            Generate a code for students or parents to view this register and chat. <br/>
            <span className="font-bold text-ink-blue">Note: Generating a new code invalidates the old one.</span>
          </p>

          {!code ? (
            <div className="space-y-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-ink-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Generating..." : "Generate Code"}
              </button>
              {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-stone-100 p-6 rounded-lg border-2 border-stone-200 border-dashed">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Access Code</p>
                <div className="text-4xl font-mono font-bold text-ink-black tracking-widest mb-2 select-all">
                    {code}
                </div>
                <p className="text-xs text-stone-500 flex items-center justify-center gap-1">
                    <Globe size={12} /> Valid Lifetime
                </p>
               </div>
               <button onClick={handleGenerate} className="text-sm text-blue-600 underline">Generate New Code</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, isVisible }: { message: string, isVisible: boolean }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-stone-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-sans">
        <Check size={18} className="text-green-400" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export function App() {
  // --- STATE ---
  
  // 1. Data Source
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem('school_classes');
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      console.error("Error loading classes", e);
    }
    return [];
  });

  const [savedCodes, setSavedCodes] = useState<{code: string, name: string}[]>(() => {
    try {
        const saved = localStorage.getItem('saved_student_codes');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // 2. Auth & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('auth_token');
  });

  const [user, setUser] = useState<{name: string, email: string} | null>(() => {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
  });

  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [sharedClassData, setSharedClassData] = useState<SchoolClass | null>(null); // For Viewer Mode
  
  const currentRealDate = new Date();
  const currentRealDay = currentRealDate.getDate();
  const currentRealMonthName = MONTHS[currentRealDate.getMonth()];

  const [activeMonth, setActiveMonth] = useState<string>(currentRealMonthName);
  const [viewMode, setViewMode] = useState<'login' | 'home' | 'create-name' | 'register'>('login');
  const [isViewerMode, setIsViewerMode] = useState(false); // READ-ONLY MODE

  // 3. UI Features State
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    type: 'class' | 'student'; 
    itemId: string | null; 
    itemName: string 
  }>({ isOpen: false, type: 'class', itemId: null, itemName: '' });
  
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Viewer Code Input (For join error handling in Login Page)
  const [viewerCode, setViewerCode] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  
  // 4. AI Features State
  const [showAIChat, setShowAIChat] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLTableCellElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('saved_student_codes', JSON.stringify(savedCodes));
  }, [savedCodes]);

  useEffect(() => {
    if (activeClassId) {
      setViewMode('register');
    }
  }, [activeClassId]);

  useEffect(() => {
     if (isAuthenticated) {
        setViewMode('home');
     }
  }, [isAuthenticated]);

  // Scroll Logic
  const scrollToToday = () => {
    if (activeMonth === currentRealMonthName && currentDayRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const element = currentDayRef.current;
        const headers = container.querySelectorAll('thead th');
        let stickyWidth = 0;
        if (headers.length >= 2) {
             stickyWidth = (headers[0] as HTMLElement).offsetWidth + (headers[1] as HTMLElement).offsetWidth;
        } else {
             const isDesktop = window.matchMedia('(min-width: 768px)').matches;
             stickyWidth = isDesktop ? 352 : 176; 
        }
        const padding = 12;
        const targetScrollLeft = element.offsetLeft - stickyWidth - padding;
        container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (viewMode === 'register' && activeMonth === currentRealMonthName) {
      const timer = setTimeout(scrollToToday, 800);
      return () => clearTimeout(timer);
    }
  }, [viewMode, activeMonth, activeClassId, currentRealMonthName]);

  // --- HELPER FUNCTIONS ---

  const getDaysInMonth = (monthName: string) => {
    const monthIndex = MONTHS.indexOf(monthName);
    const year = new Date().getFullYear();
    // Day 0 of next month is the last day of current month
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getDayLabel = (day: number, month: string) => {
    const year = new Date().getFullYear();
    const monthIndex = MONTHS.indexOf(month);
    return new Date(year, monthIndex, day).toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  const isSunday = (day: number, monthName: string) => {
     const monthIndex = MONTHS.indexOf(monthName);
     const year = new Date().getFullYear();
     const date = new Date(year, monthIndex, day);
     return date.getDay() === 0;
  };

  // --- ACTIONS ---

  const handleLogin = async (email: string, password: string) => {
      const result = await loginUser(email, password);
      if (result.success && result.token) {
          setIsAuthenticated(true);
          setUser(result.user);
          localStorage.setItem('auth_token', result.token);
          if (result.user) localStorage.setItem('auth_user', JSON.stringify(result.user));
          setViewMode('home');
          return undefined; // No error
      }
      return result.error || 'Login failed';
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Also clear old legacy items
      localStorage.removeItem('is_teacher_authenticated');
      setViewMode('login');
      setActiveClassId(null);
  };

  const createClass = () => {
    if (!newClassName.trim()) return;
    const newClass: SchoolClass = {
      id: Date.now().toString(),
      name: newClassName,
      students: SAMPLE_STUDENTS,
      attendance: {}, 
      holidays: {},
      createdAt: Date.now()
    };
    setClasses([...classes, newClass]);
    setActiveClassId(newClass.id);
    setViewMode('register');
    setActiveMonth(currentRealMonthName);
    setNewClassName('');
  };

  const saveStudentCode = (code: string, name: string) => {
    setSavedCodes(prev => {
        if (prev.some(c => c.code === code)) return prev;
        return [...prev, { code, name }];
    });
  };

  const removeStudentCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    setSavedCodes(prev => prev.filter(c => c.code !== code));
  };

  const handleJoinClass = async (codeOverride?: string) => {
    const codeToUse = codeOverride || viewerCode;
    if (!codeToUse.trim()) return;
    
    setViewerLoading(true);
    setViewerError(null);
    
    try {
      const data = await getClass(codeToUse.trim());
      setSharedClassData(data);
      setActiveClassId(data.id);
      setIsViewerMode(true);
      setViewMode('register');
      setActiveMonth(currentRealMonthName);
      
      // Save valid code
      saveStudentCode(codeToUse.trim(), data.name);
      setViewerCode('');
      setShowAddCodeModal(false);

    } catch (err: any) {
      setViewerError(err.message || "Invalid code");
    } finally {
      setViewerLoading(false);
    }
  };

  const requestDeleteClass = (e: React.MouseEvent, cls: SchoolClass) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, type: 'class', itemId: cls.id, itemName: cls.name });
  };

  const requestDeleteStudent = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if (isViewerMode) return;
    setDeleteModal({ isOpen: true, type: 'student', itemId: student.id, itemName: student.name });
  };

  const updateActiveClass = (updater: (cls: SchoolClass) => SchoolClass) => {
    if (!activeClassId || isViewerMode) return;
    setClasses(prev => {
        const clsIndex = prev.findIndex(c => c.id === activeClassId);
        if (clsIndex === -1) return prev;
        const oldClass = prev[clsIndex];
        const newClass = updater(oldClass);
        const newClasses = [...prev];
        newClasses[clsIndex] = newClass;
        return newClasses;
    });
  };

  const confirmDelete = () => {
    const { itemId, type } = deleteModal;
    if (!itemId) return;
    try {
      if (type === 'class') {
        const newClasses = classes.filter(r => r.id !== itemId);
        setClasses(newClasses);
        if (activeClassId === itemId) {
          setActiveClassId(null);
          setViewMode('home');
        }
        setToast({ show: true, message: 'Class deleted successfully' });
      } else {
        if (activeClassId) {
           updateActiveClass(cls => ({
             ...cls,
             students: cls.students.filter(s => s.id !== itemId)
           }));
           setToast({ show: true, message: 'Student removed successfully' });
        }
      }
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModal({ isOpen: false, type: 'class', itemId: null, itemName: '' });
    }
  };

  const goHome = () => {
    setActiveClassId(null);
    setSharedClassData(null);
    setIsViewerMode(false);
    
    if (isAuthenticated) {
        setViewMode('home');
    } else {
        setViewMode('login');
    }
  };

  // --- REGISTER LOGIC ---

  const handleCellClick = (studentId: string, day: number, isHoliday: boolean) => {
    if (!activeClassId || isViewerMode || isHoliday) return;
    
    updateActiveClass(cls => {
      const monthAttendance = cls.attendance[activeMonth] || {};
      const studentRecord = monthAttendance[studentId] || {};
      const currentStatus = studentRecord[day];
      
      let nextStatus: 'P' | 'A' | null = null;
      if (!currentStatus) nextStatus = 'P';
      else if (currentStatus === 'P') nextStatus = 'A';
      else nextStatus = null;

      return {
        ...cls,
        attendance: {
          ...cls.attendance,
          [activeMonth]: {
            ...monthAttendance,
            [studentId]: {
              ...studentRecord,
              [day]: nextStatus
            }
          }
        }
      };
    });
  };

  const toggleHoliday = (day: number) => {
    if (!activeClassId || isViewerMode) return;
    
    updateActiveClass(cls => {
        const currentHolidays = cls.holidays?.[activeMonth] || [];
        const isAlreadyHoliday = currentHolidays.includes(day);
        
        let newHolidays;
        if (isAlreadyHoliday) {
            newHolidays = currentHolidays.filter(d => d !== day);
        } else {
            newHolidays = [...currentHolidays, day];
        }

        return {
            ...cls,
            holidays: {
                ...(cls.holidays || {}),
                [activeMonth]: newHolidays
            }
        };
    });
  };

  const addStudent = () => {
    if (!newStudentName.trim() || !activeClassId || isViewerMode) return;
    updateActiveClass(cls => {
      const newId = Date.now().toString();
      const newRoll = (cls.students.length + 1).toString().padStart(2, '0');
      return {
        ...cls,
        students: [...cls.students, { id: newId, name: newStudentName, rollNo: newRoll }]
      };
    });
    setNewStudentName('');
    setIsAddModalOpen(false);
  };

  const downloadPDF = () => {
    const targetClass = isViewerMode ? sharedClassData : classes.find(c => c.id === activeClassId);
    if (!targetClass) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(22);
    doc.text(`${targetClass.name}`, 14, 15);
    doc.setFontSize(14);
    doc.text(`Attendance Register - ${activeMonth}`, 14, 22);

    const tableColumns = [
      { header: 'Student Name', dataKey: 'name' },
      { header: 'Roll', dataKey: 'roll' },
      ...days.map(d => ({ header: String(d), dataKey: String(d) })),
      { header: 'P', dataKey: 'p' },
      { header: 'A', dataKey: 'a' }
    ];

    const tableRows = targetClass.students.map(student => {
      const row: any = { name: student.name, roll: student.rollNo };
      let presents = 0;
      let absents = 0;
      days.forEach(d => {
        const isSun = isSunday(d, activeMonth);
        const isHol = targetClass.holidays?.[activeMonth]?.includes(d) || isSun;
        const status = targetClass.attendance[activeMonth]?.[student.id]?.[d];
        
        row[String(d)] = isHol ? 'H' : (status || '');
        if (status === 'P' && !isHol) presents++;
        if (status === 'A' && !isHol) absents++;
      });
      row.p = presents;
      row.a = absents;
      return row;
    });

    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, lineColor: [40, 40, 40], lineWidth: 0.1, textColor: [0,0,0] },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineColor: [40, 40, 40], lineWidth: 0.1, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (data.section === 'body' && !isNaN(Number(data.column.dataKey))) {
             if (data.cell.raw === 'P') { data.cell.styles.textColor = [0, 100, 0]; data.cell.styles.fontStyle = 'bold'; }
             else if (data.cell.raw === 'A') { data.cell.styles.textColor = [200, 0, 0]; data.cell.styles.fontStyle = 'bold'; }
             else if (data.cell.raw === 'H') { data.cell.styles.textColor = [150, 150, 150]; data.cell.styles.fillColor = [240, 240, 240]; }
        }
      }
    });
    doc.save(`${targetClass.name.replace(/\s+/g, '_')}_${activeMonth}_Attendance.pdf`);
  };

  // --- COMPUTED ---
  const activeClass = isViewerMode ? sharedClassData : classes.find(c => c.id === activeClassId);
  const numDays = getDaysInMonth(activeMonth);
  const days = Array.from({ length: numDays }, (_, i) => i + 1);
  const isCurrentMonthActive = activeMonth === currentRealMonthName;

  // --- RENDERERS ---

  if (!isAuthenticated && !isViewerMode && viewMode === 'login') {
      return (
          <LoginPage 
             onLogin={handleLogin}
          />
      );
  }

  if (viewMode === 'create-name') {
    return (
      <div className="min-h-screen bg-[#eceae5] flex items-center justify-center p-4 font-hand">
        <div className="bg-[#fffdf0] shadow-[8px_8px_0px_rgba(0,0,0,0.1)] p-8 max-w-md w-full border-2 border-stone-800 rounded-xl relative">
           <button onClick={() => setViewMode('home')} className="absolute top-4 left-4 text-stone-500 hover:text-ink-black">
               <ChevronLeft size={28} />
           </button>
           <div className="text-center pt-6">
             <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-stone-800">
                <BookOpen size={40} className="text-ink-blue" />
             </div>
             <h2 className="text-4xl font-bold mb-2 text-ink-black">New Class</h2>
             <p className="text-stone-500 font-sans mb-8">Give your class a name to get started</p>
             <div className="relative mb-8">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g. Grade 5-A"
                  className="w-full text-3xl p-4 border-b-4 border-stone-200 bg-transparent focus:outline-none focus:border-ink-blue text-center placeholder:text-stone-300 font-bold text-ink-blue transition-colors"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createClass()}
                />
             </div>
             <button 
               onClick={createClass}
               disabled={!newClassName.trim()}
               className="bg-ink-blue text-white text-xl px-6 py-4 rounded-xl w-full disabled:opacity-50 hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-lg font-bold"
             >
               Create Register
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'home') {
    return (
      <div className="min-h-screen bg-[#eceae5] p-6 md:p-12 font-hand relative">
        <Toast message={toast.message} isVisible={toast.show} />
        <DeleteModal 
          isOpen={deleteModal.isOpen} 
          type={deleteModal.type}
          name={deleteModal.itemName} 
          onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          onConfirm={confirmDelete}
        />

        <div className="max-w-6xl mx-auto">
          {/* Main Title */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold text-ink-black flex items-center gap-3 justify-center md:justify-start">
                <BookOpen size={44} className="text-ink-blue" />
                <span>Class Registers</span>
              </h1>
              <p className="text-stone-500 font-sans mt-2 text-lg">
                  {user ? `Welcome back, ${user.name}` : 'Welcome back, Teacher'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleLogout}
                className="bg-white text-stone-600 border border-stone-300 px-4 py-3 rounded-full shadow-sm hover:bg-stone-50 transition-all flex items-center gap-2 font-sans font-medium text-lg"
              >
                <LogOut size={20} /> <span className="hidden md:inline">Logout</span>
              </button>
              <button 
                onClick={() => { setNewClassName(''); setViewMode('create-name'); }}
                className="bg-ink-blue text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 font-sans font-medium text-lg group border-2 border-transparent"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-transform" /> <span>Create New</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
             {/* Teacher's Desk */}
             <div className="flex-1">
                <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
                   <User size={24} /> Teacher's Desk
                </h2>

                <div className="flex flex-col gap-3">
                  {classes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 text-stone-400 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
                          <BookOpen size={48} className="mb-4 opacity-50" />
                          <p className="font-sans text-xl">No saved classes.</p>
                          <p className="font-sans text-sm mt-2">Create a new class to get started.</p>
                      </div>
                  ) : (
                    classes.map(cls => (
                      <div 
                        key={cls.id} 
                        className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-lg hover:border-ink-blue cursor-pointer group shadow-sm hover:shadow-md transition-all"
                        onClick={() => { setActiveClassId(cls.id); setViewMode('register'); setActiveMonth(currentRealMonthName); }}
                      >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl font-sans shadow-sm">
                                {cls.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-lg text-ink-black">{cls.name}</p>
                                <p className="text-sm text-stone-500 font-sans flex items-center gap-2">
                                    <span className="flex items-center gap-1"><User size={14} /> {cls.students.length} Students</span>
                                    {cls.shareCode && <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold"><Cloud size={10} /> Shared</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={(e) => requestDeleteClass(e, cls)}
                                className="text-stone-300 hover:text-red-600 p-3 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete Class"
                             >
                                <Trash2 size={20} />
                             </button>
                             <div className="p-2">
                                <ArrowRight size={24} className="text-stone-300 group-hover:text-ink-blue transition-colors" />
                             </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>

             {/* Student/Parent Access (Right Column) */}
             <div className="lg:w-96">
                <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
                   <Globe size={24} /> Student / Parent Access
                </h2>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-stone-200">
                    <p className="font-sans text-stone-600 mb-4">Saved Classes</p>

                    <div className="space-y-3 mb-6">
                        {savedCodes.length === 0 && (
                            <p className="text-sm text-stone-400 italic">No saved codes yet.</p>
                        )}
                        {savedCodes.map((saved) => (
                            <div key={saved.code} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-ink-blue cursor-pointer group" onClick={() => handleJoinClass(saved.code)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs font-sans">
                                        {saved.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-ink-black">{saved.name}</p>
                                        <p className="text-xs text-stone-500 font-mono tracking-wider">{saved.code}</p>
                                    </div>
                                </div>
                                <button onClick={(e) => removeStudentCode(e, saved.code)} className="text-stone-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="font-sans text-stone-600 text-sm mb-2">Join a new class</p>
                    <div className="space-y-3">
                       <input 
                         type="text" 
                         value={viewerCode}
                         onChange={(e) => setViewerCode(e.target.value.toUpperCase())}
                         placeholder="Enter Code (e.g. X9Y2Z1)"
                         className="w-full text-center text-2xl font-mono p-3 border-2 border-stone-300 rounded focus:border-ink-blue focus:outline-none tracking-widest uppercase"
                         maxLength={6}
                       />
                       
                       <button 
                         onClick={() => handleJoinClass()}
                         disabled={viewerLoading || viewerCode.length < 6}
                         className="w-full bg-stone-800 text-white py-3 rounded font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {viewerLoading ? <Loader2 size={18} className="animate-spin" /> : <>View Register <ArrowRight size={18} /></>}
                       </button>

                       {viewerError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded text-center text-sm border border-red-100 flex items-center justify-center gap-2">
                             <AlertTriangle size={16} /> {viewerError}
                          </div>
                       )}
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // REGISTER VIEW
  if (!activeClass) return null;
  // ... (rest of the component remains unchanged)