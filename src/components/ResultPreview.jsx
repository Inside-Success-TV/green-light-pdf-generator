import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ExternalLink, Download, Tv, FileText, Loader2, CheckCircle2, Sparkles, Send, Eye, Edit3, Wand2, Bold, Italic, List, Type } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { stripHtml } from '../utils/content';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
   DYNAMIC LOGO MAPPING (Matches n8n Workflow)
   ────────────────────────────────────────────── */
const LOGO_MAPPING = {
  'Women in Power': 'https://drive.google.com/uc?export=view&id=1W2cKXSzpABN2cLCOe0vkiVtAZ70f6ecc',
  'Legacy Makers TV': 'https://drive.google.com/uc?export=view&id=1WLK-uf-W37tuVWhORSmFTTaHxVWkzpZE',
  'Inside Success Network': 'https://drive.google.com/uc?export=view&id=15tG9ALhkX0k4byezs6-ghsCMG5LOVsvP', // Default
};

function getLogoForShow(showName) {
  if (showName.includes('Women in Power')) return LOGO_MAPPING['Women in Power'];
  if (showName.includes('Legacy Makers')) return LOGO_MAPPING['Legacy Makers TV'];
  return LOGO_MAPPING['Inside Success Network'];
}

/* ──────────────────────────────────────────────
   SHOW DETECTION
   ────────────────────────────────────────────── */
function detectShowName(text) {
  if (!text) return 'Inside Success Network';
  const upperText = text.toUpperCase();
  if (upperText.includes('WOMEN IN POWER')) return 'Women in Power';
  if (upperText.includes('LEGACY MAKERS')) return 'Legacy Makers TV';
  if (upperText.includes('OPERATION CEO')) return 'Operation CEO';
  if (upperText.includes('NEXT LEVEL CEO')) return 'Next Level CEO';
  if (upperText.includes("AMERICA'S TOP LAWYERS")) return "America's Top Lawyers";
  if (upperText.includes('MASTERS OF WEALTH')) return 'Masters Of Wealth';
  if (upperText.includes("AMERICA'S BEST DOCTORS")) return "America's Best Doctors";
  return 'Inside Success Network';
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
  onResetPdf,
  onRevise,
  isRevamping,
  onManualEdit,
  drafts = [],
  activeDraftIndex = 0,
  onSelectDraft,
}) {
  const [revampInstructions, setRevampInstructions] = useState("");
  const [isEditMode, setIsEditMode] = useState(true); // Default to Edit (Raw Editor) mode
  const [showDriveBanner, setShowDriveBanner] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Show banner whenever a PDF is created, but keep it visible after button resets
  useEffect(() => {
    if (pdfCreated) setShowDriveBanner(true);
  }, [pdfCreated]);

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
  const editorContainerRef = useRef(null);

  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [storyText, isEditMode]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const element = editorContainerRef.current;
      if (!element) return;

      // Hide the editor toolbar and other UI elements temporarily for capture if needed
      // But we'll just capture the content area
      const contentArea = element.querySelector('.content-capture-area');
      
      const canvas = await html2canvas(contentArea, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'letter'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${showName.replace(/\s+/g, '_')}_${isGreenlight ? 'Greenlight' : 'CheatSheet'}.pdf`);
    } catch (err) {
      console.error("PDF Download failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleRevampSubmit = (e) => {
    e.preventDefault();
    if (!revampInstructions.trim()) return;
    onRevise(revampInstructions, action);
    setRevampInstructions("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto w-full space-y-6 pb-20"
    >
      {drafts.length > 1 && (
        <div className="premium-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-inside-gold font-black">
                Multi-client review
              </p>
              <p className="text-sm text-inside-accent/55">
                Review each preview separately before sending approved PDFs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {drafts.map((draft, index) => (
                <button
                  key={draft.id || index}
                  type="button"
                  onClick={() => onSelectDraft?.(index)}
                  className={`px-4 py-2 rounded-lg border text-sm font-black transition-all ${
                    activeDraftIndex === index
                      ? 'bg-inside-gold text-inside-dark border-inside-gold'
                      : 'bg-white/5 text-inside-accent border-white/10 hover:border-white/30'
                  }`}
                >
                  {draft.label || `Client ${index + 1}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {/* OPEN IN DRIVE - Always visible */}
          <a
            href="https://drive.google.com/drive/folders/1fE2auBlPAqggNSlZcZpnxpPaogh1tTJ7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-inside-gold/30 bg-inside-gold/10 hover:bg-inside-gold/20 transition-all text-sm font-bold text-inside-gold"
          >
            <ExternalLink className="w-4 h-4" />
            See Approved PDFs In Drive
          </a>

          <button
            onClick={() => {
              const entering = !isEditMode;
              setIsEditMode(entering);
              if (entering && onResetPdf) onResetPdf(); // Re-enable PDF button (n8n) when editing
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-inside-accent"
          >
            {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? "Styled Preview" : "Raw Editor"}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold text-inside-accent"
          >
            <RefreshCcw className="w-4 h-4" />
            Start Over
          </button>


          {/* SAVE TO DRIVE */}
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
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : pdfCreated ? (
              <><CheckCircle2 className="w-4 h-4" /> Sent!</>
            ) : (
              <><FileText className="w-4 h-4" /> Send My Approved PDF</>
            )}
          </button>
        </div>
      </div>

      {/* ── PDF CREATED SUCCESS BANNER ── */}
      <AnimatePresence>
        {showDriveBanner && (
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
                  PDF sent to Google Drive successfully!
                </p>
              </div>
              <button 
                onClick={() => setShowDriveBanner(false)}
                className="text-green-400/60 hover:text-green-400 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DOCUMENT EDITOR (Markdown or Plain Text) ── */}
      <div
        ref={editorContainerRef}
        className="rounded-xl overflow-hidden relative group bg-white shadow-xl min-h-[60vh] max-h-[80vh] flex flex-col"
      >
        <div className="w-full h-8 bg-gray-100 border-b border-gray-200 z-10 flex items-center px-4 gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
            <div className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isRevamping ? "AI Revamping…" : isEditMode ? "Raw Editor Mode" : "Styled Preview Mode"}
            </div>
        </div>

        {/* Persistent AI Chat Header (Moved to top) */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4">
          <form onSubmit={handleRevampSubmit} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm focus-within:border-inside-gold/50 transition-colors">
            <div className="pl-3 text-inside-gold">
              <Sparkles className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={revampInstructions}
              onChange={(e) => setRevampInstructions(e.target.value)}
              placeholder="Ask AI to refine this: 'Make it warmer', 'Better structure', 'Fix errors'..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-gray-700 placeholder:text-gray-400"
            />
            <button 
              type="submit"
              disabled={!revampInstructions.trim() || isRevamping}
              className="bg-inside-gold text-inside-dark px-4 py-2 rounded-lg text-xs font-black hover:bg-inside-gold/90 disabled:opacity-50 flex items-center gap-2 transition-all uppercase tracking-tighter"
            >
              {isRevamping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Refine with AI
            </button>
          </form>
        </div>

        {/* ── RICH EDITOR TOOLBAR ── */}
        <AnimatePresence>
          {isEditMode && !isRevamping && (
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
              <div className="relative mb-6">
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-inside-gold/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-inside-gold/30 to-inside-gold/10 border-2 border-inside-gold/40 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-inside-gold animate-pulse" />
                </div>
              </div>
              <Loader2 className="w-6 h-6 text-inside-gold animate-spin mb-4" />
              <RevampStatusText />
              <p className="text-xs text-gray-500 mt-3">This may take 30–60 seconds</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto content-capture-area bg-white">
          {/* Document Content Area */}
          <div className="max-w-[1000px] mx-auto px-8 py-10">
            {isEditMode ? (
              <textarea
                ref={textareaRef}
                value={isHtml ? stripHtml(storyText) : storyText}
                onChange={(e) => onManualEdit(e.target.value)}
                className="w-full resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white min-h-[50vh]"
                spellCheck="false"
                autoFocus
              />
            ) : (
              <div className="prose prose-slate max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-h1:text-center prose-h1:text-[21px] prose-h1:mb-2
                prose-h2:text-[17px] prose-h2:mt-6 prose-h2:mb-2
                prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-gray-700
                prose-li:text-[16px] prose-li:text-gray-700
                prose-hr:border-gray-200 prose-hr:my-4
                font-serif"
              >
                {/* Custom Divider logic if we want to match n8n's line below title */}
                <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => (
                      <>
                        <h1 {...props} />
                        <hr className="border-t border-gray-200 mt-2 mb-8" />
                      </>
                    )
                  }}
                >
                  {storyText}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
