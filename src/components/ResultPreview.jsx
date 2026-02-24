import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ExternalLink, Download, Tv, FileText, Loader2, CheckCircle2, Sparkles, Send, Eye, Edit3, Wand2, Bold, Italic, List, Type } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { stripHtml } from '../utils/content';

/* ──────────────────────────────────────────────
   REVAMP STATUS MESSAGES
   ────────────────────────────────────────────── */
const REVAMP_MESSAGES = [
  "AI is analyzing your document…",
  "Applying your revisions…",
  "Refining tone and structure…",
  "Polishing the final draft…",
  "Almost there — finalizing edits…",
];

function RevampStatusText() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % REVAMP_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.p
      key={msgIndex}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="text-sm font-semibold text-inside-gold tracking-wide"
    >
      {REVAMP_MESSAGES[msgIndex]}
    </motion.p>
  );
}

/* ──────────────────────────────────────────────
   SHOW DETECTION
   ────────────────────────────────────────────── */
const SHOWS = [
  'Legacy Makers TV', 'Operation CEO', 'Women in Power',
  "America's Top Lawyers", 'Masters Of Wealth', 'Next Level CEO',
  "America's Best Doctors",
];

function detectShowName(text) {
  if (!text) return 'INSIDE SUCCESS NETWORK';
  for (const s of SHOWS) { if (text.includes(s)) return s; }
  return 'INSIDE SUCCESS NETWORK';
}

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
export default function ResultPreview({ 
  result, 
  action, 
  onReset, 
  onCreatePdf, 
  isCreatingPdf, 
  pdfCreated,
  onRevise,
  isRevamping,
  onManualEdit 
}) {
  const [showRevamp, setShowRevamp] = useState(false);
  const [revampInstructions, setRevampInstructions] = useState("");
  const [isEditMode, setIsEditMode] = useState(false); // Default to Preview mode

  const storyText = typeof result === 'string' ? result : '';
  const showName = detectShowName(storyText);
  const isGreenlight = action === "Generate Greenlight PDF Letter";
  
  // Detect if the response is HTML
  const isHtml = /^\s*(<(!DOCTYPE|html|head|body|div|p|h[1-6]|table|section))/i.test(storyText);

  // Apply formatting to selection
  const applyFormat = (prefix, suffix = "") => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    // If we're editing HTML, we should strip it first to be safe, but App.jsx handles it for edits
    const newText = before + prefix + selected + suffix + after;
    onManualEdit(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Auto-resize textarea
  const textareaRef = useRef(null);
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [storyText, isEditMode]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    
    // Process formatting for print
    const lines = storyText.split('\n');
    let htmlContent = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        htmlContent += '<br/>';
      } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
        htmlContent += `<h1 style="text-align: center; font-size: 24px; margin-bottom: 5px;">${trimmed}</h1>`;
      } else if (trimmed.startsWith('# ')) {
        htmlContent += `<h1 style="font-size: 22px; margin-top: 20px;">${trimmed.substring(2)}</h1>`;
      } else if (trimmed.startsWith('## ')) {
        htmlContent += `<h2 style="font-size: 18px; margin-top: 15px; color: #4A90E2;">${trimmed.substring(3)}</h2>`;
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const text = trimmed.replace(/^[•\-]\s*/, '');
        htmlContent += `<p style="margin-left: 20px; text-indent: -15px; margin-bottom: 5px;">• ${text}</p>`;
      } else {
        htmlContent += `<p style="margin-bottom: 10px;">${trimmed}</p>`;
      }
    });

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${showName}</title>
          <style>
            @page { size: letter; margin: 0.75in 1in; }
            body { 
              margin: 0; 
              padding: 40px 60px; 
              font-family: 'Helvetica', 'Arial', sans-serif; 
              font-size: 11px; 
              line-height: 1.6; 
              color: #000; 
              background: #fff;
            }
            h1, h2, h3 { font-weight: bold; margin-bottom: 10px; }
            p { margin: 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleRevampSubmit = (e) => {
    e.preventDefault();
    if (!revampInstructions.trim()) return;
    onRevise(revampInstructions, action);
    setRevampInstructions("");
    setShowRevamp(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto w-full space-y-6 pb-20"
    >
      {/* ── TOP BAR ── */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 px-2">
        {/* Left: Show Info */}
        <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-start">
          <div className="w-11 h-11 rounded-full bg-inside-gold/20 flex items-center justify-center border border-inside-gold/30 flex-shrink-0">
            <Tv className="w-5 h-5 text-inside-gold" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-inside-gold font-black">
              {isGreenlight ? 'Greenlight Letter' : 'Casting Cheat Sheet'}
            </p>
            <h2 className="text-xl font-black text-white leading-tight">{showName}</h2>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center xl:justify-end w-full xl:w-auto">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-inside-accent"
          >
            {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? "Preview Mode" : "Edit Mode"}
          </button>

          <button
            onClick={() => setShowRevamp(!showRevamp)}
            disabled={isRevamping}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all text-sm font-bold ${
              showRevamp 
                ? "bg-inside-gold/20 border-inside-gold text-inside-gold" 
                : "border-inside-accent/20 hover:bg-white/5 text-inside-accent"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Revamp
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-inside-accent"
          >
            <RefreshCcw className="w-4 h-4" />
            Start Over
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-inside-accent"
          >
            <Download className="w-4 h-4" />
            Print
          </button>

          {/* CREATE PDF */}
          <button
            onClick={onCreatePdf}
            disabled={isCreatingPdf || pdfCreated}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg ${
              pdfCreated
                ? 'bg-green-500 text-white'
                : 'bg-inside-gold text-inside-dark hover:bg-inside-gold/90 disabled:opacity-60'
            }`}
          >
            {isCreatingPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating PDF...</>
            ) : pdfCreated ? (
              <><CheckCircle2 className="w-4 h-4" /> PDF Created!</>
            ) : (
              <><FileText className="w-4 h-4" /> Create PDF</>
            )}
          </button>
        </div>
      </div>

      {/* ── AI REVAMP PANEL ── */}
      <AnimatePresence>
        {showRevamp && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
             <form onSubmit={handleRevampSubmit} className="premium-card p-2 flex items-center gap-2 bg-inside-gold/5 border-inside-gold/30">
               <input 
                 type="text" 
                 value={revampInstructions}
                 onChange={(e) => setRevampInstructions(e.target.value)}
                 placeholder="Examples: 'Make it more persuasive', 'Shorten the intro', 'Fix the formatting'..."
                 className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-inside-accent/40 font-medium px-4"
                 autoFocus
               />
               <button 
                 type="submit"
                 disabled={!revampInstructions.trim() || isRevamping}
                 className="bg-inside-gold text-inside-dark px-6 py-2 rounded-lg font-bold hover:bg-inside-gold/90 disabled:opacity-50 flex items-center gap-2 transition-all"
               >
                 {isRevamping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                 Revise
               </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PDF CREATED SUCCESS BANNER ── */}
      <AnimatePresence>
        {pdfCreated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="text-sm font-bold text-green-400">
                  Google Doc created successfully and saved to Drive!
                </p>
              </div>
              <a
                href="https://drive.google.com/drive/folders/1fE2auBlPAqggNSlZcZpnxpPaogh1tTJ7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors text-sm font-bold text-green-400 border border-green-500/30"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Drive
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DOCUMENT EDITOR (Markdown or Plain Text) ── */}
      <div
        className="rounded-xl overflow-hidden relative group bg-white shadow-xl min-h-[60vh] max-h-[80vh] flex flex-col"
      >
        <div className="w-full h-8 bg-gray-100 border-b border-gray-200 z-10 flex items-center px-4 gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
            <div className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isRevamping ? "AI Revamping…" : isEditMode ? "VA Editor Mode" : "Preview Mode"}
            </div>
        </div>

        {/* ── RICH EDITOR TOOLBAR ── */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 "
            >
              <button 
                onClick={() => applyFormat("**", "**")}
                className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={() => applyFormat("*", "*")}
                className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => applyFormat("### ")}
                className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Heading"
              >
                <Type className="w-4 h-4" />
              </button>
              <button 
                onClick={() => applyFormat("• ")}
                className="p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <span className="text-[10px] text-gray-400 font-bold uppercase">Formatting Helper</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── REVAMP LOADING OVERLAY ── */}
        <AnimatePresence>
          {isRevamping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-sm rounded-xl"
            >
              {/* Pulsing glow ring */}
              <div className="relative mb-6">
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-inside-gold/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-inside-gold/30 to-inside-gold/10 border-2 border-inside-gold/40 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-inside-gold animate-pulse" />
                </div>
              </div>

              {/* Spinning loader */}
              <Loader2 className="w-6 h-6 text-inside-gold animate-spin mb-4" />

              {/* Rotating status messages */}
              <RevampStatusText />

              <p className="text-xs text-gray-500 mt-3">This may take 30–60 seconds</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isEditMode ? (
          <textarea
            ref={textareaRef}
            value={isHtml ? stripHtml(storyText) : storyText}
            onChange={(e) => onManualEdit(e.target.value)}
            className="w-full p-12 pt-8 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white flex-1 overflow-y-auto"
            spellCheck="false"
            autoFocus
          />
        ) : isHtml ? (
          <div 
            className="prose prose-sm max-w-none p-12 pt-8 font-serif text-gray-800 flex-1 overflow-auto"
            dangerouslySetInnerHTML={{ __html: storyText }}
          />
        ) : (
          <div className="prose prose-sm max-w-none p-12 pt-8 font-serif text-gray-800 flex-1 overflow-auto">
            <ReactMarkdown>{storyText}</ReactMarkdown>
          </div>
        )}
        
        {/* Hover Hint */}
        {!isEditMode && !isRevamping && (
          <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Click "Edit Mode" to modify text
          </div>
        )}
      </div>
    </motion.div>
  );
}
