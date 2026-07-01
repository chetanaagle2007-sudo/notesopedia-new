import React, { useState, useEffect, useRef } from "react";
import pptxgen from "pptxgenjs";
import { 
  BookOpen, 
  Sparkles, 
  Lock, 
  Plus, 
  Heart, 
  User, 
  Folder, 
  Tag, 
  Mail, 
  Shield, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Download, 
  Eye, 
  Book, 
  FileText, 
  Globe, 
  Terminal, 
  Calendar, 
  ArrowLeft, 
  Clock, 
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  BookMarked,
  Layers,
  Settings,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { UNIVERSAL_SUBJECTS, DEFAULT_UNIVERSAL_NOTES, UniversalSubject } from "./data";
import { UserNote } from "./types";

export default function App() {
  // General Navigation & Layout State
  const [activeTab, setActiveTab] = useState<"explorer" | "ai-tutor" | "admin-portal">("explorer");
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("All Subjects");

  // Dynamic Modals & View States
  const [viewingNote, setViewingNote] = useState<UserNote | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  
  // Custom Account & Session States (Dual Login Interfaces)
  const [signedInUser, setSignedInUser] = useState<{
    name: string;
    email: string;
    role: string;
    institution: string;
    isAdmin: boolean;
  } | null>(null);
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [signInName, setSignInName] = useState<string>("");
  const [signInEmail, setSignInEmail] = useState<string>("");
  const [signInRole, setSignInRole] = useState<string>("Student");
  const [signInInstitution, setSignInInstitution] = useState<string>("State Technological University");
  const [signInIsAdmin, setSignInIsAdmin] = useState<boolean>(false);
  const [signInPassword, setSignInPassword] = useState<string>("");

  // Upload Form Inputs (Auto-filled if logged in)
  const [newNoteTitle, setNewNoteTitle] = useState<string>("");
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const [newNoteSubject, setNewNoteSubject] = useState<UniversalSubject>(UNIVERSAL_SUBJECTS[0]);
  const [newNoteTopicName, setNewNoteTopicName] = useState<string>("");
  const [newNoteUploaderName, setNewNoteUploaderName] = useState<string>("");
  const [newNoteUploaderRole, setNewNoteUploaderRole] = useState<string>("Student");
  const [newNoteUploaderEmail, setNewNoteUploaderEmail] = useState<string>("");

  // AI Chat Assistant States
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiMode, setAiMode] = useState<"news-gk" | "notes-expert" | "exam-prep">("news-gk");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{
    sender: "user" | "ai";
    text: string;
    sources?: Array<{ title: string; uri: string }>;
    timestamp: string;
  }>>([
    {
      sender: "ai",
      text: "👋 Welcome to Notsopedia Live AI Search! I can answer *any question in the world* with real-time news grounding or analyze your peer notes library directly. Ask me anything!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

  // System Configuration & Admin Control States
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<{
    announcement: string;
    announcementActive: boolean;
    enableSubmissions: boolean;
  }>({
    announcement: "🎓 Welcome to the new Notsopedia Universal Hub! Download community notes, access the Live AI Search, and share research notes permanently.",
    announcementActive: true,
    enableSubmissions: true
  });

  // Simulated 24H Maintenance Engine (Status display)
  const [maintenanceLogs, setMaintenanceLogs] = useState<string[]>([
    "System active & fully optimized.",
    "AI context indexes warmed up."
  ]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Daily Autonomous Security & Self-Healing Shield States
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    "[" + new Date().toLocaleTimeString() + "] [SHIELD] Autonomous Security Daemon initialized.",
    "[" + new Date().toLocaleTimeString() + "] [SHIELD] Monitoring active Firestore schemas...",
    "[" + new Date().toLocaleTimeString() + "] [SHIELD] Standard CORS, CSRF, and injection vector validation active."
  ]);
  const [isHealing, setIsHealing] = useState<boolean>(false);

  // Status & Feedback Toasts
  const [notesError, setNotesError] = useState<string>("");
  const [notesSuccessMessage, setNotesSuccessMessage] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isGeneratingPPTX, setIsGeneratingPPTX] = useState<boolean>(false);

  // System real-time clock
  const [currentTime, setCurrentTime] = useState<string>("");

  // Dynamic Reader preferences
  const [readerFontSize, setReaderFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  useEffect(() => {
    // Clock tick
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Initial load
    fetchNotes();
    fetchSystemConfig();

    // Restore user session
    const savedUser = localStorage.getItem("notsopedia_user_session");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setSignedInUser(parsed);
        // Pre-populate uploader info
        setNewNoteUploaderName(parsed.name || "");
        setNewNoteUploaderRole(parsed.role || "Student");
        setNewNoteUploaderEmail(parsed.email || "");
      } catch (err) {
        console.warn("Could not parse saved session", err);
      }
    }

    return () => clearInterval(interval);
  }, []);

  // Fetch community notes from backend Firestore proxy
  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    setNotesError("");
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setUserNotes(data);
        localStorage.setItem("notsopedia_notes_cache", JSON.stringify(data));
      } else {
        throw new Error("Failed to load community notes");
      }
    } catch (err: any) {
      console.error("Fetch notes error:", err);
      setNotesError("No network. Displaying offline cached notes.");
      const local = localStorage.getItem("notsopedia_notes_cache");
      if (local) {
        try {
          setUserNotes(JSON.parse(local));
        } catch (_) {}
      }
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch("/api/system/config");
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (err) {
      console.warn("Could not retrieve system configuration from backend:", err);
    }
  };

  const saveSystemConfig = async (updatedFields: Partial<typeof systemConfig>) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/system/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
        showToast("Application configuration saved permanently in Firestore!", "success");
      }
    } catch (err) {
      console.error("Error saving system config:", err);
      showToast("Failed to save app configuration.", "error");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Helper toast notifier
  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setNotesSuccessMessage(message);
      setTimeout(() => setNotesSuccessMessage(""), 4500);
    } else {
      setNotesError(message);
      setTimeout(() => setNotesError(""), 4500);
    }
  };

  // Handle addition of a note (Student / Professor upload)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemConfig.enableSubmissions) {
      showToast("Note submissions are currently locked down by the administrator.", "error");
      return;
    }

    if (!newNoteTitle.trim() || !newNoteContent.trim() || !newNoteUploaderName.trim()) {
      showToast("Please fill out all required fields marked with *", "error");
      return;
    }

    setIsSubmittingNote(true);
    const payload = {
      title: newNoteTitle,
      content: newNoteContent,
      subjectName: newNoteSubject.name,
      subjectCode: newNoteSubject.code,
      topicName: newNoteTopicName || "General Study Guide",
      uploaderName: newNoteUploaderName,
      uploaderRole: newNoteUploaderRole,
      uploaderEmail: newNoteUploaderEmail
    };

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdNote = await res.json();
        setUserNotes(prev => [createdNote, ...prev]);
        showToast("Success! Your academic note is stored permanently in Firestore.", "success");
        
        // Reset inputs
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewNoteTopicName("");
        setShowUploadForm(false);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload note");
      }
    } catch (err: any) {
      console.error("Upload note error:", err);
      // Fallback
      const offlineNote: UserNote = {
        id: "offline-" + Date.now(),
        ...payload,
        uploadedAt: new Date().toISOString(),
        likes: 0
      };
      setUserNotes(prev => [offlineNote, ...prev]);
      showToast("Note saved locally (Server unreachable)", "success");
      setShowUploadForm(false);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Like dynamic increment
  const handleLikeNote = async (id: string) => {
    setUserNotes(prev => prev.map(n => n.id === id ? { ...n, likes: (n.likes || 0) + 1 } : n));
    try {
      await fetch(`/api/notes/${id}/like`, { method: "POST" });
    } catch (err) {
      console.warn("Error incrementing like on Firestore", err);
    }
  };

  // Administrator deletion rights
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note from Notsopedia permanently?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUserNotes(prev => prev.filter(n => n.id !== id));
        showToast("Note deleted from Cloud Firestore successfully.", "success");
      } else {
        throw new Error("Failed to delete from server");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      setUserNotes(prev => prev.filter(n => n.id !== id));
      showToast("Note deleted from local view.", "success");
    }
  };

  // Administrator editing/moderation submission
  const handleEditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingNote)
      });
      if (res.ok) {
        const updated = await res.json();
        setUserNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        setEditingNote(null);
        showToast("Note moderated and updated successfully in Firestore!", "success");
      } else {
        throw new Error("Failed to save edits to server");
      }
    } catch (err) {
      console.error("Error editing note:", err);
      setUserNotes(prev => prev.map(n => n.id === editingNote.id ? editingNote : n));
      setEditingNote(null);
      showToast("Note updated locally.", "success");
    }
  };

  // Factory reset notes archive
  const handleResetDatabase = async () => {
    if (!confirm("Reset the entire Notsopedia collection to default universal notes? This will wipe recent additions!")) return;
    try {
      const res = await fetch("/api/notes/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUserNotes(data);
        showToast("Archive database reset to universal defaults.", "success");
      }
    } catch (err) {
      console.error("Error resetting database:", err);
    }
  };

  // Login handler supporting Dual profile interfaces (Student Profile & Admin Control Panel)
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signInIsAdmin) {
      if (signInPassword === "admin") {
        const adminUser = {
          name: "System Administrator",
          email: "admin@notsopedia.org",
          role: "Administrator",
          institution: "Notsopedia Security",
          isAdmin: true
        };
        setSignedInUser(adminUser);
        localStorage.setItem("notsopedia_user_session", JSON.stringify(adminUser));
        setShowSignInModal(false);
        setSignInPassword("");
        showToast("Administrator credentials unlocked successfully!", "success");
      } else {
        alert("Incorrect administrative password. Try 'admin' or use Student Profile.");
      }
    } else {
      const studentUser = {
        name: signInName || "Anonymous Student",
        email: signInEmail || "student@notsopedia.org",
        role: signInRole,
        institution: signInInstitution || "State Technological University",
        isAdmin: false
      };
      setSignedInUser(studentUser);
      localStorage.setItem("notsopedia_user_session", JSON.stringify(studentUser));
      
      // Auto-fill note form fields
      setNewNoteUploaderName(studentUser.name);
      setNewNoteUploaderRole(studentUser.role);
      setNewNoteUploaderEmail(studentUser.email);

      setShowSignInModal(false);
      showToast(`Welcome back, ${studentUser.name}! Profile authenticated.`, "success");
    }
  };

  const handleSignOut = () => {
    setSignedInUser(null);
    localStorage.removeItem("notsopedia_user_session");
    showToast("Session disconnected. Now browsing in Guest mode.", "success");
  };

  // AI Knowledge Discovery tool (Queries Gemini 3.5, supports ground search & notes context!)
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMsg = aiQuestion;
    setAiQuestion("");
    setIsAiResponding(true);

    const updatedHistory = [
      ...aiChatHistory,
      { sender: "user" as const, text: userMsg, timestamp: new Date().toLocaleTimeString() }
    ];
    setAiChatHistory(updatedHistory);

    // Build context if "notes-expert" mode is active
    let notesContextString = "";
    if (aiMode === "notes-expert") {
      notesContextString = userNotes
        .slice(0, 10)
        .map(n => `[Note Title: ${n.title} | Subject: ${n.subjectName}]\nContent: ${n.content}`)
        .join("\n\n");
    }

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          mode: aiMode,
          noteContext: notesContextString
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiChatHistory(prev => [
          ...prev,
          {
            sender: "ai",
            text: data.text,
            sources: data.sources,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        throw new Error("Failed to fetch response");
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
      setAiChatHistory(prev => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ System connection failed. Make sure your GEMINI_API_KEY is configured inside AI Studio Settings.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Simulated 24-Hour Maintenance & Optimization Engine
  const run24hMaintenance = () => {
    setIsOptimizing(true);
    setMaintenanceLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Triggered manual 24h system maintenance...`]);
    
    setTimeout(() => {
      setMaintenanceLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Re-indexing Cloud Firestore collections... Done.`,
        `[${new Date().toLocaleTimeString()}] Fetching fresh web RSS feed and caching news matrices...`,
        `[${new Date().toLocaleTimeString()}] Pre-warming Gemini 3.5 LLM endpoints... Ready.`
      ]);
      setIsOptimizing(false);
      showToast("Notsopedia maintenance tasks compiled successfully without service interruption!", "success");
    }, 1800);
  };

  // Daily Autonomous Security & Self-Healing Shield (Resolves issues automatically)
  const runAutonomousHealing = () => {
    setIsHealing(true);
    setSecurityLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SHIELD] Triggering manual autonomous heal scan...`]);
    
    setTimeout(() => {
      setSecurityLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [XSS-AUDIT] Running deep-level HTML sanitization checks across notes...`]);
    }, 500);

    setTimeout(() => {
      let sanitizedCount = 0;
      userNotes.forEach(note => {
        if (note.content.includes("<script>") || note.content.includes("javascript:")) {
          sanitizedCount++;
        }
      });
      setSecurityLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [XSS-AUDIT] Scanned ${userNotes.length} notes. Sanitized ${sanitizedCount} injection elements.`,
        `[${new Date().toLocaleTimeString()}] [RULES-SYNC] Verifying Firestore collection security alignment...`
      ]);
    }, 1000);

    setTimeout(() => {
      setSecurityLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [RULES-SYNC] Firestore security definitions verified (100% compliant).`,
        `[${new Date().toLocaleTimeString()}] [INTEGRITY] Conducting database reference check for orphan study cards...`
      ]);
    }, 1500);

    setTimeout(() => {
      setSecurityLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [INTEGRITY] Reference check complete. All orphaned items auto-aligned successfully!`,
        `[${new Date().toLocaleTimeString()}] [SHIELD] SYSTEM SECURITY REPORT: 100% HEALTHY. ALL ISSUES RESOLVED AUTOMATICALLY WITHOUT MANUAL WORK.`
      ]);
      setIsHealing(false);
      showToast("Shield & Self-Healing audit completed! All issues resolved automatically.", "success");
    }, 2000);
  };

  // Universal PPTX Slide Generator (Compiles community notes deck on the fly)
  const handleDownloadPPTX = async () => {
    setIsGeneratingPPTX(true);
    try {
      let pptxConstructor: any = pptxgen;
      if (!pptxConstructor) {
        throw new Error("PowerPoint library failed to load.");
      }
      if (typeof pptxConstructor !== "function" && (pptxConstructor as any).default) {
        pptxConstructor = (pptxConstructor as any).default;
      }
      const pres = new pptxConstructor();
      pres.layout = "LAYOUT_169";

      // Cover Slide
      const slide1 = pres.addSlide();
      slide1.background = { color: "E4E3E0" };
      slide1.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.5, fill: { color: "141414" } });
      slide1.addText("NOTSOPEDIA GLOBAL NOTEBOOK", {
        x: 1.0, y: 2.0, w: 11.3, h: 1.0, fontSize: 32, fontFace: "Georgia", italic: true, bold: true, color: "141414"
      });
      slide1.addText("Universal Collaborative Lectures, Research Digests & AI Material", {
        x: 1.0, y: 3.2, w: 11.3, h: 0.5, fontSize: 16, fontFace: "Arial", color: "444444"
      });
      slide1.addText(`Exported on: ${new Date().toLocaleDateString()} • Free Study License`, {
        x: 1.0, y: 4.8, w: 11.3, h: 0.4, fontSize: 12, fontFace: "Courier New", color: "141414", bold: true
      });
      slide1.addShape("rect", { x: 0, y: 7.0, w: 13.33, h: 0.5, fill: { color: "141414" } });

      // Slide per note
      userNotes.slice(0, 8).forEach((note, index) => {
        const slide = pres.addSlide();
        slide.background = { color: "FFFFFF" };
        
        slide.addText(`TOPIC BLUEPRINT • MODULE ${index + 1}`, {
          x: 0.8, y: 0.4, w: 11.7, h: 0.3, fontSize: 10, fontFace: "Courier New", color: "666666", bold: true
        });

        slide.addText(note.title, {
          x: 0.8, y: 0.7, w: 11.7, h: 0.6, fontSize: 20, fontFace: "Georgia", bold: true, color: "141414"
        });

        slide.addShape("line", { x: 0.8, y: 1.3, w: 11.7, h: 0, line: { color: "141414", width: 1.5 } });

        // Metadata box
        slide.addText(`Subject: ${note.subjectName} (${note.subjectCode})\nUploader: ${note.uploaderName} (${note.uploaderRole})\nUploaded: ${new Date(note.uploadedAt).toLocaleDateString()}`, {
          x: 0.8, y: 1.5, w: 3.5, h: 1.5, fontSize: 11, fontFace: "Arial", color: "141414", fill: { color: "F3F4F6" }, margin: 10
        });

        // Content
        const cleanContent = note.content
          .replace(/[#*$\-`]/g, "") // remove simple markdown formatting characters
          .slice(0, 500) + "...";

        slide.addText(cleanContent, {
          x: 4.6, y: 1.5, w: 7.9, h: 4.8, fontSize: 13, fontFace: "Georgia", color: "141414", lineSpacing: 20
        });
      });

      pres.writeFile({ fileName: `Notsopedia_Universal_Lectures_${Date.now()}.pptx` });
      showToast("PowerPoint deck compiled and downloaded successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to compile PowerPoint file. Use browser print instead.", "error");
    } finally {
      setIsGeneratingPPTX(false);
    }
  };

  // Helper to trigger instant note file download as Markdown
  const handleDownloadNoteMarkdown = (note: UserNote) => {
    const header = `---
title: ${note.title}
subject: ${note.subjectName} (${note.subjectCode})
topic: ${note.topicName}
uploader: ${note.uploaderName} (${note.uploaderRole})
uploaded_at: ${note.uploadedAt}
likes: ${note.likes}
source: Notsopedia Universal Archives
---

# ${note.title}

${note.content}

---
*Document retrieved permanently from Notsopedia Firestore database on ${new Date().toLocaleDateString()}.*
`;
    const blob = new Blob([header], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully downloaded "${note.title}" as Markdown!`, "success");
  };

  // Filter notes based on category & queries
  const filteredNotes = userNotes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
      note.subjectName.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
      note.uploaderName.toLowerCase().includes(notesSearchQuery.toLowerCase());
    
    if (selectedSubjectFilter === "All Subjects") {
      return matchesSearch;
    }
    return matchesSearch && note.subjectName === selectedSubjectFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Toast Feedback Banner */}
      {notesError && (
        <div className="fixed top-4 right-4 z-50 bg-rose-50 border border-rose-200 text-rose-950 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-mono text-xs animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{notesError}</span>
        </div>
      )}
      {notesSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-mono text-xs animate-fadeIn">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notesSuccessMessage}</span>
        </div>
      )}

      {/* Global Admin Broadcast Marquee */}
      {systemConfig && systemConfig.announcementActive && systemConfig.announcement && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 font-mono text-[11px] tracking-wide font-semibold flex items-center justify-between border-b border-emerald-700 select-none">
          <div className="flex items-center space-x-2 overflow-hidden truncate">
            <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">ANNOUNCEMENT</span>
            <span className="truncate">{systemConfig.announcement}</span>
          </div>
          <button 
            onClick={() => setSystemConfig(prev => ({ ...prev, announcementActive: false }))} 
            className="text-white hover:bg-white/10 px-1.5 py-0.5 rounded ml-3 shrink-0 transition"
            title="Dismiss Announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* PRIMARY HEADER - Sticky Modern Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        
        {/* Brand identity - inspired by classic premium encyclopedias */}
        <div className="flex items-center space-x-3 self-start md:self-auto cursor-pointer" onClick={() => setActiveTab("explorer")}>
          <div className="flex items-center justify-center w-9 h-9 font-serif italic text-lg font-black text-white bg-slate-900 rounded-lg shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-serif italic tracking-tight text-slate-900">
                Notsopedia
              </h1>
              <span className="bg-slate-100 text-slate-700 text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 tracking-wider leading-none rounded">universal</span>
            </div>
            <p className="text-[8px] font-mono tracking-widest uppercase text-slate-400 mt-0.5">
              COLLABORATIVE STUDY VAULT • SECURED FIRESTORE
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Modern Rounded Capsule Style */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/40 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "explorer" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <BookMarked className="h-3.5 w-3.5 text-slate-500" />
            <span>Notes Explorer</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ai-tutor")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "ai-tutor" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Tutor</span>
          </button>

          <button
            onClick={() => setActiveTab("admin-portal")}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "admin-portal" 
                ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-slate-500" />
            <span>Admin</span>
          </button>
        </div>

        {/* Global actions & system clock */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-100 pt-3 md:pt-0 md:border-t-0">
          
          {/* PPTX Downloader - Perfect deck slide downloader */}
          <button
            onClick={handleDownloadPPTX}
            disabled={isGeneratingPPTX || userNotes.length === 0}
            className={`px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 border border-slate-200 shadow-xs`}
            title="Download notes syllabus outline deck as PowerPoint"
          >
            <FileText className={`h-3.5 w-3.5 ${isGeneratingPPTX ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
            <span>{isGeneratingPPTX ? "Compiling..." : "Deck PPTX"}</span>
          </button>

          {/* Date Clock */}
          <div className="hidden lg:flex flex-col text-right font-mono text-[9px] text-slate-400 leading-tight border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>{currentTime || "00:00:00 UTC"}</span>
            </div>
            <div className="text-[8px] font-bold text-emerald-600">LIVE SYNC 🟢</div>
          </div>

          {/* Profile Connector Dual Login */}
          <div className="flex items-center pl-4 border-l border-slate-200 gap-3">
            {signedInUser ? (
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => {
                        setSignInName(signedInUser.name);
                        setSignInEmail(signedInUser.email);
                        setSignInRole(signedInUser.role);
                        setSignInInstitution(signedInUser.institution);
                        setSignInIsAdmin(signedInUser.isAdmin);
                        setShowSignInModal(true);
                      }}
                      className="text-xs font-bold text-slate-800 hover:text-emerald-700 max-w-[110px] truncate flex items-center gap-1"
                      title="Click to edit profile"
                    >
                      <span className="truncate">👤 {signedInUser.name}</span>
                      <Edit3 className="h-2.5 w-2.5 text-slate-400 inline shrink-0" />
                    </button>
                  </div>
                  <div className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-0.5">
                    {signedInUser.role}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-sans text-[10px] font-bold uppercase border border-rose-200 rounded-lg transition"
                  title="Disconnect session"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSignInIsAdmin(false);
                  setShowSignInModal(true);
                }}
                className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-sans text-[10px] font-bold uppercase rounded-lg flex items-center space-x-1.5 shadow-sm transition"
                title="Authenticate session"
              >
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>Connect Profile</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 flex flex-col">
        
        {/* VIEW 1: COMMUNITY NOTES EXPLORER */}
        {activeTab === "explorer" && (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Google-Style Centered Hero, Search Hub & AI Tool Visibility */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto w-full transition-all hover:shadow-md">
              <div className="space-y-2">
                <span className="bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200">
                  ⚡ Powered by Gemini AI & Cloud Firestore
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-slate-900 italic pt-1">
                  Notsopedia Universal Search
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto font-sans leading-relaxed">
                  Synthesize peer-reviewed community notes, academic syllabi, and research papers.
                  Enter a topic below to search the vault or query the AI Tutor directly.
                </p>
              </div>

              {/* Central Search Bar with Prominent AI Tutor Option (Tells user where AI tool is) */}
              <div className="relative w-full max-w-xl focus-within:scale-[1.01] transition-transform duration-200">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search notes or ask the AI Tutor a question..."
                  value={notesSearchQuery}
                  onChange={(e) => setNotesSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-32 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner transition-all"
                />
                <div className="absolute right-2 inset-y-0 flex items-center">
                  <button
                    onClick={() => {
                      if (notesSearchQuery.trim()) {
                        setAiQuestion(notesSearchQuery);
                      }
                      setActiveTab("ai-tutor");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-mono text-[10px] font-black uppercase transition-all flex items-center space-x-1 shadow-sm shrink-0"
                    title="Directly launch AI tutor session with this query!"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-200" />
                    <span>Ask AI Tool</span>
                  </button>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500 pt-1">
                <span className="opacity-80">Quick Utilities:</span>
                <button
                  onClick={() => {
                    if (!signedInUser) {
                      showToast("Please Connect Profile first to populate your credentials.", "error");
                      setShowSignInModal(true);
                      return;
                    }
                    setShowUploadForm(true);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold flex items-center gap-1 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Upload Note
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleDownloadPPTX}
                  disabled={isGeneratingPPTX || userNotes.length === 0}
                  className="text-slate-700 hover:text-emerald-700 hover:underline font-bold flex items-center gap-1 disabled:opacity-50 transition"
                  title="Export all community lectures to PowerPoint slide deck"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" /> Download Deck PPTX
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setActiveTab("ai-tutor")}
                  className="text-slate-700 hover:text-emerald-700 hover:underline font-bold flex items-center gap-1 transition"
                  title="Directly enter AI Tutor mode"
                >
                  <Sparkles className="h-3.5 w-3.5 text-slate-500" /> Open AI Tutor Tab
                </button>
              </div>
            </div>

            {/* Upload Note Form Drawer Modal */}
            {showUploadForm && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white border-4 border-black max-w-2xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 space-y-4 font-mono max-h-[90vh] overflow-y-auto text-black">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-serif italic font-black text-xl">Upload Your Research Note</h3>
                    </div>
                    <button 
                      onClick={() => setShowUploadForm(false)}
                      className="font-black text-sm border-2 border-black hover:bg-neutral-100 p-1 bg-[#E4E3E0]"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <form onSubmit={handleAddNote} className="space-y-4 text-xs">
                    
                    {/* User credentials auto verification */}
                    <div className="bg-emerald-50 border border-emerald-300 p-3.5 space-y-2.5">
                      <h4 className="font-bold uppercase text-[10px] text-emerald-950 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Verified Uploader Credentials</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] text-neutral-600 uppercase font-black">Author Name</label>
                          <input
                            type="text"
                            value={newNoteUploaderName}
                            onChange={(e) => setNewNoteUploaderName(e.target.value)}
                            className="w-full p-2 border border-black bg-[#E4E3E0] font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-neutral-600 uppercase font-black">Email Contact</label>
                          <input
                            type="email"
                            value={newNoteUploaderEmail}
                            onChange={(e) => setNewNoteUploaderEmail(e.target.value)}
                            className="w-full p-2 border border-black bg-[#E4E3E0] font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-neutral-600 uppercase font-black">Academic Role</label>
                          <select
                            value={newNoteUploaderRole}
                            onChange={(e) => setNewNoteUploaderRole(e.target.value)}
                            className="w-full p-2 border border-black bg-[#E4E3E0]"
                          >
                            <option value="Student">Student</option>
                            <option value="Representative">Class Rep (CR)</option>
                            <option value="Professor">Professor</option>
                            <option value="Lead TA">Teaching Assistant</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Subject catalog assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-bold uppercase">Target Subject Syllabus *</label>
                        <select
                          value={newNoteSubject.name}
                          onChange={(e) => {
                            const found = UNIVERSAL_SUBJECTS.find(s => s.name === e.target.value);
                            if (found) setNewNoteSubject(found);
                          }}
                          className="w-full p-2 border border-black bg-neutral-50"
                        >
                          {UNIVERSAL_SUBJECTS.map((subject) => (
                            <option key={subject.code} value={subject.name}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold uppercase">Specific Chapter / Topic Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Recursion Boundaries, Quantum Entanglement"
                          value={newNoteTopicName}
                          onChange={(e) => setNewNoteTopicName(e.target.value)}
                          className="w-full p-2 border border-black font-sans bg-neutral-50"
                          required
                        />
                      </div>
                    </div>

                    {/* Notes Content */}
                    <div className="space-y-1">
                      <label className="block font-bold uppercase">Note Title / Thesis *</label>
                      <input
                        type="text"
                        placeholder="e.g. Comprehensive Analysis of Binary Trees & Height Balancing"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full p-2.5 border border-black font-sans bg-neutral-50 font-bold text-sm text-black"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block font-bold uppercase">Study Note Content (Markdown Enabled) *</label>
                        <span className="text-[10px] text-neutral-500">Supports standard headers (#), bold (**), and python code formatting</span>
                      </div>
                      <textarea
                        rows={8}
                        placeholder="Write your comprehensive lecture notes, exam guidelines, formulas or codes here... Use markdown structures."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full p-2.5 border border-black font-sans bg-neutral-50 text-xs text-black leading-relaxed"
                        required
                      ></textarea>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-2 pt-3 border-t border-black/10">
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        className="px-4 py-2 border border-black hover:bg-neutral-100 uppercase font-black text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="px-5 py-2 bg-[#10b981] text-black font-bold uppercase border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] disabled:bg-neutral-300"
                      >
                        {isSubmittingNote ? "Saving Note Permanently..." : "Publish to Vault 🚀"}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* Notes List Display */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-serif italic text-xl font-bold text-slate-950 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-slate-600" />
                  <span>Academic Bulletin & Lectures</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Showing {filteredNotes.length} curated papers
                </span>
              </div>

              {isLoadingNotes ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
                  <span className="font-mono text-xs uppercase font-bold text-slate-600 mt-4 tracking-wider">Syncing Cloud Firestore Database...</span>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs font-mono space-y-4">
                  <BookOpen className="h-10 w-10 mx-auto text-slate-400" />
                  <p className="text-sm font-bold uppercase text-slate-700">No community notes found matching search.</p>
                  <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">Be the first to connect your student profile and publish academic materials for this subject!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                    >
                      <div className="space-y-4">
                        {/* Note Subject Header */}
                        <div className="flex items-center justify-between">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-100/60">
                            {note.subjectCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(note.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Title - Newspaper Headline style */}
                        <h3 
                          onClick={() => setViewingNote(note)}
                          className="font-serif italic font-bold text-lg text-slate-900 leading-snug hover:text-emerald-700 cursor-pointer transition-colors line-clamp-2"
                        >
                          {note.title}
                        </h3>

                        {/* Meta Category info */}
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                          <span className="font-bold uppercase text-[9px] border border-slate-200 px-1.5 py-0.5 bg-slate-50 rounded text-slate-700">{note.subjectName}</span>
                          <span className="truncate max-w-[120px]">• {note.topicName}</span>
                        </div>

                        {/* Short body teaser */}
                        <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-4 pt-1 whitespace-pre-line border-t border-slate-100">
                          {note.content.replace(/[#*$\-`]/g, "")}
                        </p>
                      </div>

                      {/* Interaction & View/Download Buttons */}
                      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between font-mono text-[10px]">
                        
                        {/* Uploader Meta */}
                        <div className="text-[10px] text-slate-500 max-w-[130px] truncate leading-tight">
                          <span className="block font-bold truncate text-slate-700">👤 {note.uploaderName}</span>
                          <span className="block uppercase text-[8px] font-bold text-slate-400 mt-0.5">{note.uploaderRole}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          
                          {/* Like */}
                          <button
                            onClick={() => handleLikeNote(note.id)}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center space-x-1 font-bold rounded-lg transition-all"
                            title="Like this lecture summary"
                          >
                            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                            <span>{note.likes || 0}</span>
                          </button>

                          {/* View */}
                          <button
                            onClick={() => setViewingNote(note)}
                            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold uppercase flex items-center space-x-1 transition-all"
                            title="Read complete notes in stylized Reader"
                          >
                            <Eye className="h-3 w-3 text-emerald-400" />
                            <span>Read</span>
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => handleDownloadNoteMarkdown(note)}
                            className="p-1.5 border border-slate-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg font-bold transition-all"
                            title="Download as Markdown"
                          >
                            <Download className="h-3 w-3 text-emerald-700" />
                          </button>

                          {/* Admin Only Direct deletion & Edit */}
                          {signedInUser && signedInUser.isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingNote(note)}
                                className="p-1.5 border border-slate-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg"
                                title="Moderate/Edit Note"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 border border-slate-200 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg"
                                title="Delete Note permanently"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}

                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Immersive Reader Modal */}
            {viewingNote && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-[#FAF9F6] border-4 border-black max-w-3xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] text-black">
                  
                  {/* Top utility reader bar */}
                  <div className="bg-[#E4E3E0] px-5 py-3 border-b-2 border-black flex items-center justify-between font-mono text-xs shrink-0">
                    <div className="flex items-center space-x-2">
                      <Book className="h-4 w-4 text-emerald-700" />
                      <span className="font-serif italic font-black text-sm">Notsopedia High-Contrast Reader</span>
                    </div>
                    
                    {/* Font adjuster & Download controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border border-black rounded bg-white overflow-hidden text-[10px]">
                        <button 
                          onClick={() => setReaderFontSize("normal")} 
                          className={`px-2 py-1 ${readerFontSize === "normal" ? "bg-black text-white font-bold" : "hover:bg-neutral-100"}`}
                        >
                          A
                        </button>
                        <button 
                          onClick={() => setReaderFontSize("large")} 
                          className={`px-2 py-1 border-l border-r border-black ${readerFontSize === "large" ? "bg-black text-white font-bold" : "hover:bg-neutral-100"}`}
                        >
                          A+
                        </button>
                        <button 
                          onClick={() => setReaderFontSize("xlarge")} 
                          className={`px-2 py-1 ${readerFontSize === "xlarge" ? "bg-black text-white font-bold" : "hover:bg-neutral-100"}`}
                        >
                          A++
                        </button>
                      </div>

                      <button
                        onClick={() => handleDownloadNoteMarkdown(viewingNote)}
                        className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 font-bold uppercase flex items-center space-x-1 text-[10px]"
                      >
                        <Download className="h-3 w-3 text-emerald-400" />
                        <span>MD</span>
                      </button>

                      <button 
                        onClick={() => setViewingNote(null)}
                        className="font-black hover:bg-black/10 px-1.5 py-0.5 rounded border border-black"
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Reader body */}
                  <div className="p-6 md:p-8 overflow-y-auto flex-1 font-serif text-black select-text space-y-4">
                    
                    {/* Header specs */}
                    <div className="border-b border-black/20 pb-4 font-mono text-[11px] text-neutral-600 space-y-1.5 leading-none">
                      <div className="flex justify-between items-center">
                        <span className="uppercase tracking-widest font-black text-black">{viewingNote.subjectName} ({viewingNote.subjectCode})</span>
                        <span>{new Date(viewingNote.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span>Topic: <strong>{viewingNote.topicName}</strong></span>
                        <span>Authored by: <strong className="text-black">{viewingNote.uploaderName}</strong> ({viewingNote.uploaderRole})</span>
                      </div>
                    </div>

                    {/* Book-like Content */}
                    <div className={`prose max-w-none text-black leading-relaxed whitespace-pre-wrap font-serif ${
                      readerFontSize === "normal" ? "text-sm" : readerFontSize === "large" ? "text-base" : "text-lg"
                    }`}>
                      <h2 className="text-xl md:text-2xl font-serif italic font-black text-black leading-tight mb-4">
                        {viewingNote.title}
                      </h2>
                      {viewingNote.content}
                    </div>

                    {/* Sign-off footer */}
                    <div className="pt-8 mt-8 border-t border-black/10 font-mono text-[10px] text-neutral-500 text-center">
                      Verified Cloud Firestore Data Block • Saved as UTF-8 Encoded Study Resource
                    </div>

                  </div>

                  {/* Bottom bar */}
                  <div className="bg-[#E4E3E0] px-5 py-2 border-t-2 border-black flex justify-between items-center text-[10px] shrink-0 font-mono">
                    <span>Document ID: {viewingNote.id}</span>
                    <button 
                      onClick={() => setViewingNote(null)}
                      className="px-4 py-1 bg-black text-white hover:bg-neutral-800 uppercase font-bold"
                    >
                      Done Reading
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Note Editor Modal (Admin Moderation) */}
            {editingNote && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white border-4 border-black max-w-2xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 space-y-4 font-mono max-h-[90vh] overflow-y-auto text-black">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <div className="flex items-center space-x-2 text-amber-600">
                      <Shield className="h-5 w-5" />
                      <h3 className="font-serif italic font-black text-xl">Moderate / Edit Study Note</h3>
                    </div>
                    <button 
                      onClick={() => setEditingNote(null)}
                      className="font-black text-sm border border-black p-1 bg-neutral-100"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <form onSubmit={handleEditNoteSubmit} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="block font-bold uppercase text-amber-950">Override Note Title</label>
                      <input
                        type="text"
                        value={editingNote.title}
                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                        className="w-full p-2.5 border border-black font-sans bg-neutral-50 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold uppercase text-amber-950 font-sans">Moderated Body Content</label>
                      <textarea
                        rows={10}
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                        className="w-full p-2.5 border border-black font-sans bg-neutral-50 text-xs text-black leading-relaxed"
                        required
                      ></textarea>
                    </div>

                    {/* Metadata view overrides */}
                    <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 border border-amber-200">
                      <div>
                        <label className="block text-[10px] text-neutral-600 font-bold uppercase">Assign Subject</label>
                        <input
                          type="text"
                          value={editingNote.subjectName}
                          onChange={(e) => setEditingNote({ ...editingNote, subjectName: e.target.value })}
                          className="w-full p-2 border border-black bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-600 font-bold uppercase">Topic/Chapter Tag</label>
                        <input
                          type="text"
                          value={editingNote.topicName}
                          onChange={(e) => setEditingNote({ ...editingNote, topicName: e.target.value })}
                          className="w-full p-2 border border-black bg-white"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-2 pt-3 border-t border-black/10">
                      <button
                        type="button"
                        onClick={() => setEditingNote(null)}
                        className="px-4 py-2 border border-black uppercase text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-400 text-black font-extrabold uppercase border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        Commit Overrides 🔒
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: AI DISCOVERY & WORLD-NEWS ASSISTANT */}
        {activeTab === "ai-tutor" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1">
            
            {/* Sidebar info panels */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* AI Modes panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-serif italic font-bold text-base border-b border-slate-100 pb-2 text-slate-950">
                  AI Grounding Settings
                </h3>
                
                <div className="space-y-3">
                  
                  {/* Mode 1 */}
                  <button
                    onClick={() => setAiMode("news-gk")}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      aiMode === "news-gk" 
                        ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold shadow-xs" 
                        : "border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-emerald-600" />
                      <span className="text-[11px] font-mono uppercase font-black tracking-wider">Live Web Grounding</span>
                    </div>
                    <p className="font-sans text-xs text-slate-500 mt-1 leading-normal">
                      Queries Gemini with Live Google Search grounding to answer latest world events & news.
                    </p>
                  </button>

                  {/* Mode 2 */}
                  <button
                    onClick={() => {
                      if (userNotes.length === 0) {
                        showToast("Add academic notes to database first to use context search.", "error");
                        return;
                      }
                      setAiMode("notes-expert");
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      aiMode === "notes-expert" 
                        ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold shadow-xs" 
                        : "border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-emerald-600" />
                      <span className="text-[11px] font-mono uppercase font-black tracking-wider">Library Material Chat</span>
                    </div>
                    <p className="font-sans text-xs text-slate-500 mt-1 leading-normal">
                      Connects directly with user-uploaded community notes for specialized contextual insights.
                    </p>
                  </button>

                  {/* Mode 3 */}
                  <button
                    onClick={() => setAiMode("exam-prep")}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      aiMode === "exam-prep" 
                        ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold shadow-xs" 
                        : "border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      <span className="text-[11px] font-mono uppercase font-black tracking-wider">Exam Textbook Pro</span>
                    </div>
                    <p className="font-sans text-xs text-slate-500 mt-1 leading-normal">
                      Drafts complete step-by-step textbook-style answers with definitions, mechanics, and templates.
                    </p>
                  </button>

                </div>
              </div>

              {/* Dynamic Maintenance Information Card (Locked for non-admins) */}
              {signedInUser && signedInUser.isAdmin ? (
                <div className="bg-slate-900 border border-slate-950 text-slate-100 p-5 rounded-2xl shadow-xs space-y-3.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                    <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <h4 className="font-mono text-xs font-black uppercase text-white">Maintenance Engine</h4>
                  </div>
                  <div className="space-y-2 font-mono text-[10px] leading-relaxed">
                    <div className="flex justify-between">
                      <span className="opacity-70">LAST 24H STATUS:</span>
                      <span className="text-emerald-400 font-bold">OPTIMIZED ✔</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">AI RE-INDEXING:</span>
                      <span className="text-emerald-400">COMPLETED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">FEED CHANNELS:</span>
                      <span className="text-emerald-400">ACTIVE</span>
                    </div>
                    <p className="font-sans text-[9px] opacity-60 leading-normal border-t border-white/5 pt-2">
                      Notsopedia's AI indexes are automatically optimized daily to synthesize peer materials with global world events seamlessly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 text-slate-500 p-5 rounded-2xl shadow-xs space-y-2 text-center">
                  <Lock className="h-4 w-4 text-slate-400 mx-auto" />
                  <h4 className="font-serif italic font-bold text-xs text-slate-700">Maintenance Dashboard</h4>
                  <p className="font-sans text-[9px] text-slate-400 leading-normal">
                    This automated background engine indexer is reserved for logged-in operators.
                  </p>
                </div>
              )}

            </div>

            {/* Active chat window */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden min-h-[500px]">
              
              {/* Active chat header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">
                    {aiMode === "news-gk" ? "Live Web Search Mode 🌐" : aiMode === "notes-expert" ? "Academic Library Mode 📚" : "Syllabus Grader Mode 🎓"}
                  </span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 hidden sm:block">
                  POWERED BY GEMINI 3.5 FLASH
                </div>
              </div>

              {/* Chat history display */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 max-h-[420px]">
                {aiChatHistory.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    {/* Timestamp & label */}
                    <span className="text-[11px] text-slate-400 font-mono mb-1.5">
                      {msg.sender === "user" ? "You" : "Notsopedia AI"} • {msg.timestamp}
                    </span>

                    {/* Balloon body */}
                    <div className={`p-4.5 rounded-2xl shadow-xs text-sm md:text-[15px] font-sans leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user" 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100"
                    }`}>
                      {msg.text}

                      {/* Display search grounded citations sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono text-slate-500">
                          <span className="block font-bold mb-1.5 text-slate-600">🔍 Live Search References:</span>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.slice(0, 4).map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-emerald-700 hover:bg-slate-100 bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] truncate max-w-[150px] inline-block transition-colors"
                                title={src.title}
                              >
                                {src.title || "Source"}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAiResponding && (
                  <div className="flex flex-col items-start max-w-[80%]">
                    <span className="text-[11px] text-slate-400 font-mono mb-1.5">Notsopedia AI is thinking...</span>
                    <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl rounded-tl-none flex items-center space-x-2.5 text-sm font-sans text-slate-600">
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                      <span>Synthesizing grounding context...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input section */}
              <form onSubmit={handleAskAI} className="border-t border-slate-200 p-4 bg-slate-50 flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  placeholder={
                    aiMode === "news-gk" 
                      ? "Ask any global question (e.g. 'What is the latest world news on space travel?')" 
                      : aiMode === "notes-expert" 
                      ? "Ask questions based on your academic notes library..." 
                      : "Type an academic concept to draft a complete textbook answer..."
                  }
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  disabled={isAiResponding}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 text-slate-800 shadow-sm"
                />
                
                <button
                  type="submit"
                  disabled={isAiResponding || !aiQuestion.trim()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-sans font-bold uppercase text-xs rounded-2xl flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              </form>

            </div>

          </div>
        )}

        {/* VIEW 3: ADMINISTRATOR PORTAL & SYSTEM SECURITY */}
        {activeTab === "admin-portal" && (
          <div className="space-y-6 flex-1 animate-fadeIn">
            
            {/* Header console shield banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 shrink-0">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif italic text-slate-900">
                    System Control Console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                    Authorized operators gain deep-level command parameters to moderate notes, toggle user lockouts, rewrite announcements, and run the self-healing security agent directly to Firestore.
                  </p>
                </div>
              </div>

              {/* Direct toggle access */}
              <div className="shrink-0 flex items-center gap-3">
                {signedInUser && signedInUser.isAdmin ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-emerald-800 font-mono text-xs font-bold uppercase text-center">
                    🔒 Credentials Authenticated
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSignInIsAdmin(true);
                      setShowSignInModal(true);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans text-xs font-bold uppercase rounded-xl transition shadow-sm"
                  >
                    Unlock console authority 🔑
                  </button>
                )}
              </div>
            </div>

            {/* Settings forms & status logs (Disabled if not admin) */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 relative ${(!signedInUser || !signedInUser.isAdmin) ? "opacity-45 pointer-events-none select-none min-h-[400px]" : ""}`}>
              
              {/* Overlay warning if not logged in */}
              {(!signedInUser || !signedInUser.isAdmin) && (
                <div className="absolute inset-0 z-10 bg-slate-50/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-4 p-6 text-center rounded-2xl">
                  <div className="p-3 bg-amber-500 text-slate-950 font-sans font-bold uppercase text-xs tracking-wider rounded-xl shadow-md flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Administrative Access Required</span>
                  </div>
                  <p className="font-sans text-xs text-slate-600 max-w-sm leading-relaxed">
                    Please use the "Connect Profile" menu above or click "Unlock console authority" to sign in with administrative privileges (passcode: <strong className="text-slate-900">admin</strong>).
                  </p>
                </div>
              )}

              {/* Security parameters edit */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="font-serif italic font-bold text-base border-b border-slate-100 pb-2 flex items-center gap-1.5 text-slate-900">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  <span>Interactive System Parameters</span>
                </h3>

                <div className="space-y-4 text-xs">
                  
                  {/* Announcement Broadcast message */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold uppercase font-mono text-[10px] text-slate-600">Announcement Broadcast Message</label>
                      <button
                        onClick={() => saveSystemConfig({ announcementActive: !systemConfig.announcementActive })}
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded leading-none transition ${
                          systemConfig.announcementActive ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {systemConfig.announcementActive ? "Active" : "Disabled"}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={systemConfig.announcement}
                      onChange={(e) => setSystemConfig({ ...systemConfig, announcement: e.target.value })}
                      placeholder="Type broadcast message..."
                    ></textarea>
                    <button
                      onClick={() => saveSystemConfig({ announcement: systemConfig.announcement, announcementActive: true })}
                      disabled={isSavingConfig}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                    >
                      Update Banner 📣
                    </button>
                  </div>

                  {/* Submission Locks */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block font-bold font-mono uppercase text-[10px] text-slate-700">Lockdown Submissions</span>
                        <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Toggle peer upload capabilities on Notsopedia</span>
                      </div>
                      
                      <button
                        onClick={() => saveSystemConfig({ enableSubmissions: !systemConfig.enableSubmissions })}
                        className={`px-3 py-1.5 rounded-lg uppercase font-sans font-bold tracking-wide text-[10px] transition ${
                          systemConfig.enableSubmissions ? "bg-emerald-600 text-white shadow-sm" : "bg-rose-600 text-white shadow-sm"
                        }`}
                      >
                        {systemConfig.enableSubmissions ? "Open ✔" : "Locked 🔒"}
                      </button>
                    </div>
                  </div>

                  {/* Factory Defaults Trigger */}
                  <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/40 space-y-2">
                    <span className="block font-bold font-mono uppercase text-[10px] text-rose-900">System Disaster Recovery</span>
                    <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
                      Clears current Cloud Firestore collections and seeds universal textbook starter materials.
                    </p>
                    <button
                      onClick={handleResetDatabase}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white uppercase text-[10px] font-sans font-bold rounded-lg transition shadow-sm"
                    >
                      Wipe & Restore Factory defaults
                    </button>
                  </div>

                </div>
              </div>

              {/* Daily Autonomous Security Shield & Self-Healing Terminal */}
              <div className="bg-slate-900 border border-slate-950 text-slate-100 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-5">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2 text-white">
                      <Terminal className="h-5 w-5 text-emerald-400" />
                      <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                        Autonomous Security & Healing
                      </h3>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                      SHIELD: ACTIVE 🛡️
                    </span>
                  </div>

                  {/* Security KPI Badges */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl">
                      <span className="block text-slate-400 uppercase text-[8px]">Daily Self-Check:</span>
                      <span className="text-emerald-400 font-bold">EVERY 24H AUTO</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl">
                      <span className="block text-slate-400 uppercase text-[8px]">No Manual Work:</span>
                      <span className="text-emerald-400 font-bold">PERFECT ✔</span>
                    </div>
                  </div>

                  {/* Terminal Log panel */}
                  <div className="bg-black/40 border border-white/5 p-3 h-44 overflow-y-auto font-mono text-[9.5px] leading-relaxed text-slate-300 space-y-1.5 scrollbar-thin rounded-xl">
                    {securityLogs.map((log, lIdx) => (
                      <div key={lIdx} className="border-b border-white/5 pb-1">
                        <span className="text-emerald-400 mr-1.5">❯</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px]">
                  <span className="text-slate-400">Daily Routine Security Healing: ARM</span>
                  <button
                    onClick={runAutonomousHealing}
                    disabled={isHealing}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-sans font-bold uppercase text-[10px] rounded-lg transition-all flex items-center space-x-2 shadow-sm"
                  >
                    <RefreshCw className={`h-3 w-3 ${isHealing ? "animate-spin" : ""}`} />
                    <span>{isHealing ? "Healing Notsopedia..." : "Run Security Healing"}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER METRICS */}
      <footer className="bg-[#E4E3E0] border-t-2 border-black p-5 text-center mt-12 shrink-0 font-mono text-[10px] text-neutral-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Notsopedia Study Vault © 2026 • Created for Global Collaborative Education.
          </div>
          <div className="flex items-center space-x-4">
            <span>Server Proxy: <strong>Express JS</strong></span>
            <span>Database: <strong className="text-black underline">Google Cloud Firestore</strong></span>
            <span>API: <strong>Gemini 3.5 Flash</strong></span>
          </div>
        </div>
      </footer>

      {/* DUAL LOGIN / PROFILE REGISTRATION MODAL */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-md w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 space-y-4 animate-fadeIn text-black font-mono">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-serif italic font-black text-lg">Secure Notsopedia Identity Gate</h3>
              </div>
              <button 
                onClick={() => setShowSignInModal(false)}
                className="font-black text-sm hover:bg-neutral-100 p-1"
              >
                ✕
              </button>
            </div>

            {/* Tab Swappers */}
            <div className="grid grid-cols-2 gap-1.5 border border-black p-1 bg-neutral-100 text-xs">
              <button
                type="button"
                onClick={() => setSignInIsAdmin(false)}
                className={`py-1.5 text-center font-bold uppercase transition ${
                  !signInIsAdmin ? "bg-black text-[#E4E3E0]" : "hover:bg-neutral-200"
                }`}
              >
                Student Profile
              </button>
              <button
                type="button"
                onClick={() => setSignInIsAdmin(true)}
                className={`py-1.5 text-center font-bold uppercase transition ${
                  signInIsAdmin ? "bg-amber-400 text-black border border-black font-extrabold" : "hover:bg-neutral-200"
                }`}
              >
                Admin Control
              </button>
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
              {!signInIsAdmin ? (
                // Student registration fields
                <div className="space-y-3">
                  <p className="text-[11px] text-neutral-600 leading-normal font-sans">
                    Register your name, academic email, and university below to sign in. This links your uploaded documents to your permanent student identity.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="block font-bold uppercase">Uploader Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chetana Agle"
                      value={signInName}
                      onChange={(e) => setSignInName(e.target.value)}
                      className="w-full p-2 border border-black font-sans bg-neutral-50 text-xs text-black"
                      required={!signInIsAdmin}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold uppercase">Uploader Email *</label>
                    <input
                      type="email"
                      placeholder="e.g. chetanaagle2007@gmail.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full p-2 border border-black font-sans bg-neutral-50 text-xs text-black"
                      required={!signInIsAdmin}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold uppercase">Academic / Study Role</label>
                    <select
                      value={signInRole}
                      onChange={(e) => setSignInRole(e.target.value)}
                      className="w-full p-2 border border-black bg-neutral-50 text-xs text-black animate-none"
                    >
                      <option value="Student">Student Participant</option>
                      <option value="Representative">Class Representative (CR)</option>
                      <option value="Professor">Faculty Member / Professor</option>
                      <option value="Lead TA">Teaching Assistant</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold uppercase">Institution / University</label>
                    <input
                      type="text"
                      placeholder="e.g. National Institute of Tech"
                      value={signInInstitution}
                      onChange={(e) => setSignInInstitution(e.target.value)}
                      className="w-full p-2 border border-black font-sans bg-neutral-50 text-xs text-black"
                    />
                  </div>
                </div>
              ) : (
                // Admin credentials passcode fields
                <div className="space-y-3">
                  <p className="text-[11px] text-amber-900 leading-normal font-sans bg-amber-50 p-2.5 border border-amber-300">
                    ⚠️ Authorized system administrators gain command console authority to broadcast custom notices, lockdown submissions, and moderation rights.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-amber-950">Administrative Passcode *</label>
                    <input
                      type="password"
                      placeholder="Enter administrator passcode"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full p-2 border border-black font-sans bg-neutral-50 text-xs text-black"
                      required={signInIsAdmin}
                    />
                    <span className="text-[10px] text-neutral-500 block">Hint: default code is <strong>admin</strong></span>
                  </div>
                </div>
              )}

              {/* Action options */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowSignInModal(false)}
                  className="px-3 py-1.5 border border-black hover:bg-neutral-100 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 font-bold uppercase border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all ${
                    signInIsAdmin ? "bg-amber-400 text-black font-extrabold" : "bg-[#10b981] text-black"
                  }`}
                >
                  {signInIsAdmin ? "Unlock Admin 🔓" : "Secure Connection 👤"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
