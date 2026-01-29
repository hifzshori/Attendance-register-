import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, BookOpen, ChevronLeft, LayoutGrid, User, Calendar, Save, ArrowRightCircle, Download, Check, AlertTriangle, X, Bot, Lock, Cloud, Globe, ArrowRight, Sun, MessageCircle, Paperclip, FileText, Image as ImageIcon, Send } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, SchoolClass, ChatMessage } from './types';
import AIChat from './components/AIChat';
import { shareClass, getClass, sendMessage, deleteMessage } from './services/api';

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
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
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
        if (updatedClass.messages) {
          setMessages(updatedClass.messages);
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
    if ((!inputText.trim() && !file) || !schoolClass.shareCode) return;

    setIsSending(true);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: mySessionId,
      senderName: isTeacher ? 'Teacher' : 'Student',
      content: inputText,
      timestamp: Date.now(),
      type: file ? file.type : 'text',
      fileUrl: file?.url,
      fileName: file?.name
    };

    try {
      await sendMessage(schoolClass.shareCode, newMessage);
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    } catch (e) {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!schoolClass.shareCode || !confirm("Delete this message?")) return;
    
    // Optimistic update
    setMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      await deleteMessage(schoolClass.shareCode, msgId);
    } catch (e) {
      alert("Failed to delete message");
      // Revert optimization would require refetching, which polling handles
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
  };

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
              <p className="text-xs opacity-80">{isTeacher ? 'Chat with Class' : 'Chat with Teacher'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-stone-400 text-sm mt-10">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => {
             // Identify if the message is from "me" based on session ID
             const isMe = msg.senderId === mySessionId;
             // Teacher can delete any message, Student can only delete their own
             const canDelete = isTeacher || isMe;
             
             return (
               <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                 <div className={`max-w-[85%] p-3 rounded-xl shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-stone-800 rounded-bl-none'}`}>
                    
                    {/* Header: Name */}
                    {msg.senderId !== mySessionId && (
                       <p className={`text-xs font-bold mb-1 ${isMe ? 'text-blue-200' : 'text-blue-600'}`}>
                         {msg.senderName} 
                         {/* Fallback for older messages that might not have teacher vs student distinction clearly */}
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
                    
                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-stone-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
                 
                 {/* Delete Button */}
                 {canDelete && (
                    <button 
                        onClick={() => handleDelete(msg.id)}
                        className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity
                            ${isMe ? '-left-8' : '-right-8'}
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
        <div className="p-3 bg-white border-t border-stone-200 flex gap-2 items-center">
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-stone-400 hover:text-blue-600 p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isSending || (!inputText && !fileInputRef.current?.files?.length)}
            className="bg-ink-blue text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

  // 2. Navigation & View State
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [sharedClassData, setSharedClassData] = useState<SchoolClass | null>(null); // For Viewer Mode
  
  const currentRealDate = new Date();
  const currentRealDay = currentRealDate.getDate();
  const currentRealMonthName = MONTHS[currentRealDate.getMonth()];

  const [activeMonth, setActiveMonth] = useState<string>(currentRealMonthName);
  const [viewMode, setViewMode] = useState<'home' | 'create-name' | 'register'>('home');
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

  // Viewer Code Input
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
    setViewMode('home');
    setIsViewerMode(false);
    setViewerCode('');
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
              <p className="text-stone-500 font-sans mt-2 text-lg">Manage attendance, chat, or join a shared class.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setNewClassName(''); setViewMode('create-name'); }}
                className="bg-ink-blue text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 font-sans font-medium text-lg group border-2 border-transparent"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-transform" /> <span>Create New</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
             {/* Left Column: Teacher/Saved Classes */}
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
                        className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg hover:border-ink-blue cursor-pointer group shadow-sm hover:shadow-md transition-all"
                        onClick={() => { setActiveClassId(cls.id); setViewMode('register'); setActiveMonth(currentRealMonthName); }}
                      >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg font-sans shadow-sm">
                                {cls.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-base text-ink-black">{cls.name}</p>
                                <p className="text-xs text-stone-500 font-sans flex items-center gap-1">
                                    <User size={12} /> {cls.students.length} Students
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={(e) => requestDeleteClass(e, cls)}
                                className="text-stone-300 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Class"
                             >
                                <Trash2 size={18} />
                             </button>
                             <ArrowRight size={18} className="text-stone-300 group-hover:text-ink-blue transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>

             {/* Right Column: Viewer Access */}
             <div className="lg:w-96">
                <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
                   <Globe size={24} /> Student / Parent Access
                </h2>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-stone-200">
                    <p className="font-sans text-stone-600 mb-4">Saved Classes</p>

                    <div className="space-y-3 mb-6">
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
                         {viewerLoading ? "Loading..." : "View Register"} <ArrowRight size={18} />
                       </button>

                       {viewerError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded text-center text-sm border border-red-100">
                             {viewerError}
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

  const getStudentStats = (studentId: string) => {
    const record = activeClass.attendance[activeMonth]?.[studentId];
    if (!record) return { presents: 0, absents: 0 };
    
    let presents = 0;
    let absents = 0;
    
    // Iterate only over valid days for the month
    days.forEach(day => {
        const isSun = isSunday(day, activeMonth);
        const isHol = activeClass.holidays?.[activeMonth]?.includes(day) || isSun;
        if (isHol) return; // Don't count holidays in stats
        
        const status = record[day];
        if (status === 'P') presents++;
        if (status === 'A') absents++;
    });

    return { presents, absents };
  };

  return (
    <div className="min-h-screen bg-stone-200 p-2 md:p-8 font-hand relative">
      <Toast message={toast.message} isVisible={toast.show} />
      
      {/* AI Components */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      
      {/* Chat Interface */}
      {isChatOpen && activeClass && (
         <ChatInterface 
            schoolClass={activeClass}
            isTeacher={!isViewerMode}
            onClose={() => setIsChatOpen(false)}
         />
      )}

      {/* Add Code Modal inside Viewer Mode */}
      {showAddCodeModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
             <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Join Another Class</h3>
                    <button onClick={() => setShowAddCodeModal(false)}><X size={20}/></button>
                 </div>
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
                         {viewerLoading ? "Loading..." : "Join Class"} <ArrowRight size={18} />
                       </button>
                       {viewerError && <div className="text-red-600 text-sm text-center">{viewerError}</div>}
                 </div>
             </div>
        </div>
      )}

      <DeleteModal 
          isOpen={deleteModal.isOpen} 
          type={deleteModal.type}
          name={deleteModal.itemName} 
          onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          onConfirm={confirmDelete}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        classData={activeClass}
        onCodeGenerated={(code) => {
            // Update local state with the new code so teacher can chat immediately
            updateActiveClass(c => ({ ...c, shareCode: code }));
        }}
      />
      
      {/* Floating Action Menu for AI Tools */}
      {!isViewerMode && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <button 
            onClick={() => setShowAIChat(true)}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-ink-blue hover:bg-blue-50 transition-all hover:scale-110"
            title="Teaching Assistant"
          >
            <Bot size={24} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-[98vw] mx-auto mb-2 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
           <button onClick={goHome} className="bg-white p-2 rounded-full shadow hover:bg-stone-100 text-stone-600">
             <LayoutGrid size={20} />
           </button>
           <div>
              <h1 className="text-3xl md:text-5xl font-bold text-ink-black tracking-wide mb-1 flex items-center gap-3">
                  {activeClass.name}
                  {isViewerMode && (
                    <span className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-full font-sans uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <Lock size={12} /> View Only
                    </span>
                  )}
              </h1>
              <p className="text-stone-600 font-sans italic text-sm md:text-lg flex items-center gap-2">
                 <Save size={14} className="text-green-600"/> {isViewerMode ? 'Read Only Mode' : 'Auto-saved to browser'}
              </p>
           </div>
        </div>
        
        <div className="flex gap-2 md:gap-3 items-center flex-wrap">
            {/* Chat Button (Available to both) */}
            <button 
                onClick={() => {
                    if (isViewerMode || activeClass.shareCode) {
                        setIsChatOpen(true);
                    } else {
                        // If teacher hasn't shared yet, prompt to share
                        setToast({show: true, message: "Share the class first to enable chat!"});
                        setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
                        setIsShareModalOpen(true);
                    }
                }} 
                className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:bg-purple-700 font-sans transition-colors text-sm md:text-base"
            >
                <MessageCircle size={18} /> <span className="hidden md:inline">Chat</span>
            </button>

            {isViewerMode && (
                <button onClick={() => setShowAddCodeModal(true)} className="flex items-center gap-2 bg-stone-100 text-stone-700 border border-stone-300 px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:bg-stone-200 font-sans transition-colors text-sm md:text-base">
                    <Plus size={18} /> <span className="hidden md:inline">Join Another</span>
                </button>
            )}

            {!isViewerMode ? (
            <>
                {/* Teacher Actions */}
                <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 bg-ink-blue text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow hover:bg-blue-700 font-sans transition-colors text-sm md:text-base">
                    <Cloud size={18} /> <span className="hidden md:inline">Share</span>
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:bg-emerald-700 font-sans transition-colors text-sm md:text-base">
                    <Plus size={18} /> <span className="hidden md:inline">Add Student</span>
                </button>
            </>
            ) : null}
            
            <button onClick={downloadPDF} className="flex items-center gap-2 bg-stone-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:bg-stone-700 font-sans transition-colors text-sm md:text-base">
                <Download size={18} /> <span className="hidden md:inline">PDF</span>
            </button>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="max-w-[98vw] mx-auto mb-0 overflow-x-auto flex gap-1 pb-2 border-b-2 border-transparent">
         {MONTHS.map(m => (
             <button
                key={m}
                onClick={() => setActiveMonth(m)}
                className={`px-3 md:px-5 py-2 rounded-t-lg font-sans text-sm font-medium transition-all whitespace-nowrap
                    ${activeMonth === m 
                        ? 'bg-paper text-ink-blue border-t border-x border-stone-300 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] translate-y-[1px] z-10' 
                        : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
                    }`}
             >
                 {m}
             </button>
         ))}
      </div>

      {/* Main Register Paper */}
      <div className="max-w-[98vw] mx-auto bg-paper shadow-paper rounded-b-sm rounded-tr-sm overflow-hidden border-2 border-stone-900 relative">
        <div className="absolute top-0 bottom-0 left-[8.5rem] md:left-[16rem] w-[2.5rem] md:w-[6rem] border-x-2 border-ink-red pointer-events-none z-50"></div>
        <div className="absolute top-0 bottom-0 right-12 md:right-16 w-12 md:w-16 border-l-2 border-ink-black pointer-events-none z-50"></div>
        <div className="absolute top-0 bottom-0 right-0 w-12 md:w-16 border-x-2 border-ink-black pointer-events-none z-50"></div>

        <div ref={scrollContainerRef} className="overflow-x-auto relative z-0 pl-0">
          <table className="w-max border-collapse">
            <thead>
              <tr className="h-16">
                <th className="sticky top-0 left-0 z-40 bg-paper border-b-2 border-stone-900 text-left px-2 md:px-4 text-base md:text-xl font-bold text-ink-red shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[8.5rem] md:w-[16rem] min-w-[8.5rem] md:min-w-[16rem]">Student Name</th>
                <th className="sticky top-0 left-[8.5rem] md:left-[16rem] z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-base md:text-xl font-bold text-ink-red shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[2.5rem] md:w-[6rem] min-w-[2.5rem] md:min-w-[6rem]">Roll</th>
                {days.map(d => {
                  const dayName = getDayLabel(d, activeMonth);
                  const isSun = isSunday(d, activeMonth);
                  const isHol = activeClass.holidays?.[activeMonth]?.includes(d) || isSun;
                  
                  return (
                    <th 
                        key={d} 
                        ref={isCurrentMonthActive && d === currentRealDay ? currentDayRef : null} 
                        onClick={() => toggleHoliday(d)}
                        className={`sticky top-0 z-30 border-b-2 border-stone-900 border-r border-blue-200 min-w-[3rem] md:min-w-[4.5rem] text-center font-sans py-2 bg-paper group cursor-pointer hover:bg-stone-50 transition-colors
                            ${isCurrentMonthActive && d === currentRealDay ? 'bg-yellow-400 border-b-ink-blue border-b-4' : ''}
                            ${isHol ? 'bg-red-50 text-red-800' : 'text-stone-700'}
                        `}
                        title={isSun ? "Sunday" : "Click to toggle holiday"}
                    >
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className={`text-[0.65rem] md:text-xs font-normal uppercase ${isHol ? 'text-red-500 font-bold' : 'text-stone-500'}`}>{dayName}</span>
                        <span className={`text-sm md:text-lg font-bold ${isHol ? 'text-red-600' : ''}`}>{d}</span>
                        {isHol && !isSun && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                      </div>
                    </th>
                  );
                })}
                <th className="sticky top-0 z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-sm md:text-lg shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem] right-12 md:right-16"><span className="text-green-700 font-bold">P</span></th>
                <th className="sticky top-0 right-0 z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-sm md:text-lg shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem]"><span className="text-red-700 font-bold">A</span></th>
              </tr>
            </thead>
            <tbody>
              {activeClass.students.map((student) => {
                const stats = getStudentStats(student.id);
                return (
                  <tr key={student.id} className="h-16 hover:bg-yellow-50 transition-colors group">
                    <td className="sticky left-0 z-20 bg-paper border-b border-blue-200 px-2 md:px-4 font-semibold text-sm md:text-lg whitespace-nowrap group-hover:bg-yellow-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[8.5rem] md:w-[16rem] min-w-[8.5rem] md:min-w-[16rem]">
                       <div className="flex justify-between items-center group/cell w-full">
                          <span className="truncate pr-2" title={student.name}>{student.name}</span>
                          {!isViewerMode && (
                            <button onClick={(e) => requestDeleteStudent(e, student)} className="text-stone-300 hover:text-red-600 opacity-0 group-hover/cell:opacity-100 transition-all p-1" title="Remove Student">
                                <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                    </td>
                    <td className="sticky left-[8.5rem] md:left-[16rem] z-20 bg-paper border-b border-blue-200 text-center text-stone-600 text-sm md:text-lg group-hover:bg-yellow-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[2.5rem] md:w-[6rem] min-w-[2.5rem] md:min-w-[6rem]">{student.rollNo}</td>
                    {days.map(d => {
                      const isSun = isSunday(d, activeMonth);
                      const isHol = activeClass.holidays?.[activeMonth]?.includes(d) || isSun;
                      const status = activeClass.attendance[activeMonth]?.[student.id]?.[d];
                      const isToday = isCurrentMonthActive && d === currentRealDay;
                      
                      return (
                        <td 
                            key={d} 
                            onClick={() => handleCellClick(student.id, d, isHol)} 
                            className={`
                                border-b border-blue-200 border-r border-blue-100 min-w-[3rem] md:min-w-[4.5rem] text-center select-none relative h-16 
                                ${!isViewerMode && !isHol ? 'cursor-pointer hover:bg-blue-50/20' : 'cursor-default'} 
                                ${isToday && !isHol ? 'bg-yellow-200' : ''}
                                ${isHol ? 'bg-stone-200/60' : ''}
                            `}
                        >
                          {isHol ? null : (
                              <>
                                {status === 'P' && <span className="text-ink-blue font-bold text-xl md:text-2xl animate-in fade-in zoom-in duration-100">P</span>}
                                {status === 'A' && <span className="text-ink-red font-bold text-xl md:text-2xl animate-in fade-in zoom-in duration-100">A</span>}
                              </>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky z-20 bg-paper border-b border-blue-200 text-center font-bold text-lg md:text-xl text-green-700 bg-opacity-90 group-hover:bg-yellow-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem] right-12 md:right-16">{stats.presents}</td>
                    <td className="sticky right-0 z-20 bg-paper border-b border-blue-200 text-center font-bold text-lg md:text-xl text-red-600 bg-opacity-90 group-hover:bg-yellow-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem]">{stats.absents}</td>
                  </tr>
                );
              })}
              {Array.from({length: Math.max(0, 15 - activeClass.students.length)}).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-16">
                      <td className="sticky left-0 z-10 bg-paper border-b border-blue-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[8.5rem] md:w-[16rem] min-w-[8.5rem] md:min-w-[16rem]"></td>
                      <td className="sticky left-[8.5rem] md:left-[16rem] z-10 bg-paper border-b border-blue-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[2.5rem] md:w-[6rem] min-w-[2.5rem] md:min-w-[6rem]"></td>
                      {days.map(d => {
                           const isSun = isSunday(d, activeMonth);
                           const isHol = activeClass.holidays?.[activeMonth]?.includes(d) || isSun;
                           return (
                               <td key={d} className={`border-b border-blue-200 border-r border-blue-100 min-w-[3rem] md:min-w-[4.5rem] relative ${isCurrentMonthActive && d === currentRealDay ? 'bg-yellow-200' : ''} ${isHol ? 'bg-stone-200/60' : ''}`}>
                               </td>
                           );
                      })}
                      <td className="sticky z-10 bg-paper border-b border-blue-200 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem] right-12 md:right-16"></td>
                      <td className="sticky right-0 z-10 bg-paper border-b border-blue-200 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem]"></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[200] font-sans p-4">
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-sm animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>
            <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Full Name" autoFocus className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && addStudent()} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded">Cancel</button>
              <button onClick={addStudent} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}