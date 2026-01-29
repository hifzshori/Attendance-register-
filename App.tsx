import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, BookOpen, ChevronLeft, LayoutGrid, User, Calendar, Save, ArrowRightCircle, Download, Check, AlertTriangle, X, Upload, FileJson, Bot, Image as ImageIcon, Lock, Unlock, Sparkles, Cloud, Globe, ArrowRight } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, SchoolClass } from './types';
import AIChat from './components/AIChat';
import ImageGenerator from './components/ImageGenerator';
import { shareClass, getClass } from './services/api';

const DAYS_IN_MONTH = 31; 
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
  classData
}: {
  isOpen: boolean;
  onClose: () => void;
  classData: SchoolClass;
}) => {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(null);
      setError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await shareClass(classData);
      setCode(result.code);
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
            Generate a temporary code for students or parents to view this register.
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
            <div className="bg-stone-100 p-6 rounded-lg border-2 border-stone-200 border-dashed">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Access Code</p>
              <div className="text-4xl font-mono font-bold text-ink-black tracking-widest mb-2 select-all">
                {code}
              </div>
              <p className="text-xs text-stone-500 flex items-center justify-center gap-1">
                <Globe size={12} /> Valid for 60 minutes
              </p>
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
  
  // Viewer Code Input
  const [viewerCode, setViewerCode] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  
  // 4. AI Features State
  const [showAIChat, setShowAIChat] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLTableCellElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);

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
             stickyWidth = isDesktop ? 352 : 216; 
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

  // --- ACTIONS ---

  const createClass = () => {
    if (!newClassName.trim()) return;
    const newClass: SchoolClass = {
      id: Date.now().toString(),
      name: newClassName,
      students: SAMPLE_STUDENTS,
      attendance: {}, 
      createdAt: Date.now()
    };
    setClasses([...classes, newClass]);
    setActiveClassId(newClass.id);
    setViewMode('register');
    setActiveMonth(currentRealMonthName);
    setNewClassName('');
  };

  const handleJoinClass = async () => {
    if (!viewerCode.trim()) return;
    setViewerLoading(true);
    setViewerError(null);
    
    try {
      const data = await getClass(viewerCode.trim());
      setSharedClassData(data);
      setActiveClassId(data.id); // Set ID just for consistency, though we use sharedClassData
      setIsViewerMode(true);
      setViewMode('register');
      setActiveMonth(currentRealMonthName);
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

  // --- IMPORT/EXPORT ---

  const handleExportJSON = () => {
    const target = isViewerMode ? sharedClassData : classes.find(c => c.id === activeClassId);
    if (!target) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(target, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${target.name.replace(/\s+/g, '_')}_backup.json`;
    link.click();
    setToast({ show: true, message: 'Class data exported successfully' });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.id && json.name && Array.isArray(json.students) && json.attendance) {
           const existing = classes.findIndex(c => c.id === json.id);
           if (existing >= 0) {
             json.id = Date.now().toString();
             json.name = `${json.name} (Imported)`;
           }
           setClasses(prev => [...prev, json]);
           setToast({ show: true, message: 'Class imported successfully!' });
        } else {
           throw new Error("Invalid file structure");
        }
      } catch (err) {
        alert("Failed to import. Invalid JSON.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      }
    };
    reader.readAsText(file);
  };

  // --- REGISTER LOGIC ---

  const handleCellClick = (studentId: string, day: number) => {
    if (!activeClassId || isViewerMode) return;
    
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
        const status = targetClass.attendance[activeMonth]?.[student.id]?.[d];
        row[String(d)] = status || '';
        if (status === 'P') presents++;
        if (status === 'A') absents++;
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
        }
      }
    });
    doc.save(`${targetClass.name.replace(/\s+/g, '_')}_${activeMonth}_Attendance.pdf`);
  };

  // --- COMPUTED ---
  const activeClass = isViewerMode ? sharedClassData : classes.find(c => c.id === activeClassId);
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
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
        <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />

        <div className="max-w-6xl mx-auto">
          {/* Main Title */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold text-ink-black flex items-center gap-3 justify-center md:justify-start">
                <BookOpen size={44} className="text-ink-blue" />
                <span>Class Registers</span>
              </h1>
              <p className="text-stone-500 font-sans mt-2 text-lg">Manage attendance or join a shared class.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={triggerImportClick}
                className="bg-white text-stone-600 px-6 py-3 rounded-full shadow hover:bg-stone-50 transition-all flex items-center gap-2 font-sans font-medium text-lg border-2 border-transparent"
              >
                <Upload size={24} /> <span>Import</span>
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
             {/* Left Column: Teacher/Saved Classes */}
             <div className="flex-1">
                <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
                   <User size={24} /> Teacher's Desk
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center p-12 text-stone-400 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
                          <BookOpen size={48} className="mb-4 opacity-50" />
                          <p className="font-sans text-xl">No saved classes.</p>
                          <p className="font-sans text-sm mt-2">Create a new class to get started.</p>
                      </div>
                  ) : (
                    classes.map(cls => (
                      <div key={cls.id} className="group relative">
                        <div className="absolute inset-0 rounded-xl transform translate-y-3 translate-x-3 bg-yellow-100 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
                        <div 
                          className="relative bg-[#fffdf0] rounded-xl border-2 border-stone-800 p-0 overflow-hidden h-full transition-all group-hover:-translate-y-1 cursor-pointer"
                          onClick={() => { setActiveClassId(cls.id); setViewMode('register'); setActiveMonth(currentRealMonthName); }}
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 rotate-1 shadow-sm z-0 bg-yellow-300/80 pointer-events-none"></div>
                          <div className="relative z-10 p-6 pt-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-full bg-white border-2 border-stone-800 flex items-center justify-center text-3xl font-bold text-ink-blue shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    {cls.name.charAt(0).toUpperCase()}
                                </div>
                                <button 
                                    onClick={(e) => requestDeleteClass(e, cls)}
                                    className="p-2 -mr-2 -mt-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors z-20"
                                >
                                    <Trash2 size={20} />
                                </button>
                              </div>
                              <h3 className="text-3xl font-bold text-ink-black mb-1 group-hover:text-ink-blue transition-colors line-clamp-1">{cls.name}</h3>
                              <div className="h-px w-full bg-stone-200 my-4"></div>
                              <div className="flex items-center gap-3 text-stone-600 font-sans mb-auto">
                                <User size={18} /> <span className="font-semibold">{cls.students.length}</span> Students
                              </div>
                              <div className="mt-6 pt-4 border-t border-dashed border-stone-300 flex justify-between items-center">
                                <span className="text-xs font-sans text-stone-400 font-medium">CREATED: {new Date(cls.createdAt).toLocaleDateString()}</span>
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-ink-blue group-hover:text-white transition-colors">
                                    <ArrowRightCircle size={20} />
                                </div>
                              </div>
                          </div>
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
                    <p className="font-sans text-stone-600 mb-4">Enter the 6-character code provided by your teacher to view the attendance register.</p>
                    
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
                         onClick={handleJoinClass}
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
    const values = Object.values(record);
    const presents = values.filter(s => s === 'P').length;
    const absents = values.filter(s => s === 'A').length;
    return { presents, absents };
  };

  return (
    <div className="min-h-screen bg-stone-200 p-2 md:p-8 font-hand relative">
      <Toast message={toast.message} isVisible={toast.show} />
      
      {/* AI Components */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      {showImageGen && <ImageGenerator onClose={() => setShowImageGen(false)} />}
      
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
          <button 
            onClick={() => setShowImageGen(true)}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-all hover:scale-110"
            title="Classroom Art"
          >
            <ImageIcon size={24} />
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
            {!isViewerMode ? (
            <>
                {/* Teacher Actions */}
                <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 bg-ink-blue text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow hover:bg-blue-700 font-sans transition-colors text-sm md:text-base">
                    <Cloud size={18} /> <span className="hidden md:inline">Share</span>
                </button>
                <button onClick={handleExportJSON} className="flex items-center gap-2 bg-white text-ink-blue border border-blue-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-sm hover:bg-blue-50 font-sans transition-colors text-sm md:text-base">
                    <FileJson size={18} /> <span className="hidden md:inline">Backup</span>
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:bg-emerald-700 font-sans transition-colors text-sm md:text-base">
                    <Plus size={18} /> <span className="hidden md:inline">Add Student</span>
                </button>
            </>
            ) : (
             <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-sans text-sm font-semibold border border-yellow-200 flex items-center gap-2">
                <Lock size={16} /> Editing Disabled (Viewer Mode)
             </div>
            )}
            
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
        <div className="absolute top-0 bottom-0 left-[10rem] md:left-[16rem] w-[3.5rem] md:w-[6rem] border-x-2 border-ink-red pointer-events-none z-50"></div>
        <div className="absolute top-0 bottom-0 right-12 md:right-16 w-12 md:w-16 border-l-2 border-ink-black pointer-events-none z-50"></div>
        <div className="absolute top-0 bottom-0 right-0 w-12 md:w-16 border-x-2 border-ink-black pointer-events-none z-50"></div>

        <div ref={scrollContainerRef} className="overflow-x-auto relative z-0 pl-0">
          <table className="w-max border-collapse">
            <thead>
              <tr className="h-16">
                <th className="sticky top-0 left-0 z-40 bg-paper border-b-2 border-stone-900 text-left px-2 md:px-4 text-base md:text-xl font-bold text-ink-red shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[10rem] md:w-[16rem] min-w-[10rem] md:min-w-[16rem]">Student Name</th>
                <th className="sticky top-0 left-[10rem] md:left-[16rem] z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-base md:text-xl font-bold text-ink-red shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[3.5rem] md:w-[6rem] min-w-[3.5rem] md:min-w-[6rem]">Roll</th>
                {days.map(d => (
                  <th key={d} ref={isCurrentMonthActive && d === currentRealDay ? currentDayRef : null} className={`sticky top-0 z-30 border-b-2 border-stone-900 border-r border-blue-200 min-w-[3rem] md:min-w-[4.5rem] text-center text-stone-700 font-sans text-sm md:text-lg font-bold py-2 bg-paper ${isCurrentMonthActive && d === currentRealDay ? 'bg-yellow-400 text-ink-blue font-extrabold border-b-ink-blue border-b-4' : ''}`}>{d}</th>
                ))}
                <th className="sticky top-0 z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-sm md:text-lg shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem] right-12 md:right-16"><span className="text-green-700 font-bold">P</span></th>
                <th className="sticky top-0 right-0 z-40 bg-paper border-b-2 border-stone-900 text-center px-1 text-sm md:text-lg shadow-[-2px_0_5px_rgba(0,0,0,0.05)] w-12 md:w-16 min-w-[3rem]"><span className="text-red-700 font-bold">A</span></th>
              </tr>
            </thead>
            <tbody>
              {activeClass.students.map((student) => {
                const stats = getStudentStats(student.id);
                return (
                  <tr key={student.id} className="h-16 hover:bg-yellow-50 transition-colors group">
                    <td className="sticky left-0 z-20 bg-paper border-b border-blue-200 px-2 md:px-4 font-semibold text-sm md:text-lg whitespace-nowrap group-hover:bg-yellow-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[10rem] md:w-[16rem] min-w-[10rem] md:min-w-[16rem]">
                       <div className="flex justify-between items-center group/cell w-full">
                          <span className="truncate pr-2" title={student.name}>{student.name}</span>
                          {!isViewerMode && (
                            <button onClick={(e) => requestDeleteStudent(e, student)} className="text-stone-300 hover:text-red-600 opacity-0 group-hover/cell:opacity-100 transition-all p-1" title="Remove Student">
                                <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                    </td>
                    <td className="sticky left-[10rem] md:left-[16rem] z-20 bg-paper border-b border-blue-200 text-center text-stone-600 text-sm md:text-lg group-hover:bg-yellow-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[3.5rem] md:w-[6rem] min-w-[3.5rem] md:min-w-[6rem]">{student.rollNo}</td>
                    {days.map(d => {
                      const status = activeClass.attendance[activeMonth]?.[student.id]?.[d];
                      const isToday = isCurrentMonthActive && d === currentRealDay;
                      return (
                        <td key={d} onClick={() => handleCellClick(student.id, d)} className={`border-b border-blue-200 border-r border-blue-100 min-w-[3rem] md:min-w-[4.5rem] text-center select-none relative h-16 ${!isViewerMode ? 'cursor-pointer hover:bg-blue-50/20' : 'cursor-default'} ${isToday ? 'bg-yellow-200' : ''}`}>
                          {status === 'P' && <span className="text-ink-blue font-bold text-xl md:text-2xl animate-in fade-in zoom-in duration-100">P</span>}
                          {status === 'A' && <span className="text-ink-red font-bold text-xl md:text-2xl animate-in fade-in zoom-in duration-100">A</span>}
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
                      <td className="sticky left-0 z-10 bg-paper border-b border-blue-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[10rem] md:w-[16rem] min-w-[10rem] md:min-w-[16rem]"></td>
                      <td className="sticky left-[10rem] md:left-[16rem] z-10 bg-paper border-b border-blue-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[3.5rem] md:w-[6rem] min-w-[3.5rem] md:min-w-[6rem]"></td>
                      {days.map(d => <td key={d} className={`border-b border-blue-200 border-r border-blue-100 min-w-[3rem] md:min-w-[4.5rem] ${isCurrentMonthActive && d === currentRealDay ? 'bg-yellow-200' : ''}`}></td>)}
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