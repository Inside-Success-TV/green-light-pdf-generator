import React, { useState } from 'react';
import { Sparkles, FileText, Layout, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function CastingForm({ onSubmit, onComplianceCheck, isProcessing, isCompliant, complianceSummary }) {
  const [transcript, setTranscript] = useState("");
  const [action, setAction] = useState("Generate Greenlight PDF Letter");
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [isMultiClient, setIsMultiClient] = useState(false);
  const [letterCount, setLetterCount] = useState(2);
  const [targetClientName, setTargetClientName] = useState("");
  const [clientOneName, setClientOneName] = useState("");
  const [clientTwoName, setClientTwoName] = useState("");

  const actions = [
    {
      id: "Generate Greenlight PDF Letter",
      label: "Greenlight Letter",
      description: "Generate a formatted approval letter for the production board.",
      icon: FileText
    },
    {
      id: "Generate Script Call Template \"Cheat Sheet\"",
      label: "Casting Cheat Sheet",
      description: "Create a structured breakdown of story arcs and growth points.",
      icon: Layout
    }
  ];

  const isGreenlight = action === "Generate Greenlight PDF Letter";
  const requiresTargetClientName = isGreenlight && isMultiClient && letterCount === 1;
  const canSubmit =
    transcript.trim() &&
    (!requiresTargetClientName || targetClientName.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      transcript,
      action,
      multiClient: isGreenlight
        ? {
            enabled: isMultiClient,
            letterCount,
            targetClientName: targetClientName.trim(),
            clientNames:
              letterCount === 2
                ? [clientOneName.trim(), clientTwoName.trim()]
                : [targetClientName.trim()],
          }
        : { enabled: false },
    });
  };

  const handleCompliance = () => {
    if (!transcript.trim()) return;
    onComplianceCheck(transcript);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tighter gradient-text">
          CASTING INTELLIGENCE
        </h1>
        <p className="text-inside-accent/60 text-lg max-w-2xl mx-auto">
          Paste your raw call transcript below. Our AI will analyze the narrative arcs and generate professional production documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Action Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                setAction(act.id);
                if (act.id !== "Generate Greenlight PDF Letter") {
                  setIsMultiClient(false);
                }
              }}
              className={cn(
                "premium-card p-6 text-left transition-all duration-300 group relative overflow-hidden",
                action === act.id 
                  ? "border-inside-gold bg-inside-gold/10 ring-1 ring-inside-gold" 
                  : "hover:border-white/30"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  action === act.id ? "bg-inside-gold text-inside-dark" : "bg-white/5 text-inside-gold"
                )}>
                  <act.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{act.label}</h3>
                  <p className="text-sm text-inside-accent/50">{act.description}</p>
                </div>
              </div>
              {action === act.id && (
                <motion.div 
                  layoutId="active-bg"
                  className="absolute inset-0 bg-inside-gold/5 -z-10"
                />
              )}
            </button>
          ))}
        </div>

        {isGreenlight && (
          <div className="premium-card p-6 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-inside-gold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Multi-client transcript</h3>
                  <p className="text-sm text-inside-accent/50">
                    Use only when one Zoom transcript contains more than one client.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isMultiClient}
                onClick={() => setIsMultiClient((value) => !value)}
                className={cn(
                  "relative h-8 w-16 rounded-full border transition-colors flex-shrink-0",
                  isMultiClient
                    ? "bg-inside-gold border-inside-gold"
                    : "bg-white/10 border-white/15"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white transition-transform",
                    isMultiClient ? "translate-x-8" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <AnimatePresence>
              {isMultiClient && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 border-t border-white/10 pt-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-inside-gold mb-3">
                        How many Greenlight letters?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setLetterCount(count)}
                            className={cn(
                              "rounded-lg border px-4 py-3 text-sm font-black uppercase tracking-wider transition-all",
                              letterCount === count
                                ? "border-inside-gold bg-inside-gold text-inside-dark"
                                : "border-white/10 bg-white/5 text-inside-accent hover:border-white/30"
                            )}
                          >
                            {count} Letter{count > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    {letterCount === 1 ? (
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-inside-gold mb-2">
                          Client name to generate
                        </label>
                        <input
                          value={targetClientName}
                          onChange={(e) => setTargetClientName(e.target.value)}
                          placeholder="Enter the approved client's name"
                          className="w-full rounded-lg border border-white/10 bg-inside-gray/70 px-4 py-3 text-inside-accent outline-none transition-all focus:border-inside-gold/70"
                          required={requiresTargetClientName}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-inside-gold mb-2">
                            Client 1 name
                          </label>
                          <input
                            value={clientOneName}
                            onChange={(e) => setClientOneName(e.target.value)}
                            placeholder="Optional but recommended"
                            className="w-full rounded-lg border border-white/10 bg-inside-gray/70 px-4 py-3 text-inside-accent outline-none transition-all focus:border-inside-gold/70"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-inside-gold mb-2">
                            Client 2 name
                          </label>
                          <input
                            value={clientTwoName}
                            onChange={(e) => setClientTwoName(e.target.value)}
                            placeholder="Optional but recommended"
                            className="w-full rounded-lg border border-white/10 bg-inside-gray/70 px-4 py-3 text-inside-accent outline-none transition-all focus:border-inside-gold/70"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Transcript Area */}
        <div className="premium-card p-1">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="[00:00:00] Manager: Tell me about your journey...
[00:05:23] Guest: I started with nothing in a small town..."
            className="w-full h-80 bg-inside-gray/50 text-inside-accent p-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-inside-gold/50 transition-all resize-none font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2 relative">
            <button
              type="button"
              disabled
              className="px-8 py-4 rounded-full border border-white/10 text-inside-accent/30 font-black tracking-widest uppercase flex items-center gap-3 cursor-not-allowed opacity-50 grayscale relative"
            >
              <ShieldCheck className="w-5 h-5" />
              Compliance Check
              <span className="absolute -top-2 -right-2 text-[9px] bg-inside-gold/20 text-inside-gold px-2 py-0.5 rounded-full font-black border border-inside-gold/30 tracking-wider">
                BETA
              </span>
            </button>
            <span className="text-[10px] text-inside-accent/30 font-medium">Coming soon</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !canSubmit}
            className={cn(
              "px-12 py-4 rounded-full bg-inside-gold text-inside-dark font-black tracking-widest uppercase flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-gold-glow",
              isProcessing && "animate-pulse"
            )}
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Analyzing Narrative...
              </>
            ) : (
              <>
                Generate Document
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Compliance Report Rendering */}
        <AnimatePresence>
          {showComplianceReport && complianceSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="premium-card overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-inside-gold/5 flex items-center justify-between">
                <h3 className="font-bold text-inside-gold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  COMPLIANCE AUDIT REPORT
                </h3>
                <span className="text-[10px] bg-green-500/20 text-green-500 px-3 py-1 rounded-full font-black border border-green-500/30">
                  PASSED
                </span>
              </div>
              <div className="p-8 prose prose-invert max-w-none text-inside-accent/70 text-sm leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: complianceSummary }} />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
        
      </form>
    </motion.div>
  );
}
