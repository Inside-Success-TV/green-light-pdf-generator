import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import CastingForm from "./components/CastingForm";
import ResultPreview from "./components/ResultPreview";
import { cleanTranscript } from "./utils/transcript";
import { stripHtml } from "./utils/content";

// Workflow 1: AI story generation — takes transcript, returns the formatted story text
const STORY_WEBHOOK_URL =
  import.meta.env.VITE_WEBHOOK_URL ||
  "https://insidesuccess.app.n8n.cloud/webhook/4f4509f0-01a3-4005-baf5-bc5ae07d897c";

// Workflow 2: PDF / Google Doc creation — takes the story content, creates formatted doc, returns "File Created"
const PDF_WEBHOOK_URL =
  import.meta.env.VITE_PDF_WEBHOOK_URL ||
  "https://insidesuccess.app.n8n.cloud/webhook/87ad4f51-e02e-40e6-9e77-66886c2139fa";

// Compliance (future)
const COMPLIANCE_WEBHOOK_URL =
  import.meta.env.VITE_COMPLIANCE_WEBHOOK_URL || STORY_WEBHOOK_URL;

// Edit/Revamp Webhook (Workflow 3)
const EDIT_WEBHOOK_URL =
  import.meta.env.VITE_EDIT_WEBHOOK_URL || STORY_WEBHOOK_URL;

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // Story text from workflow 1
  const [currentAction, setCurrentAction] = useState(null);
  const [error, setError] = useState(null);
  const [processStatus, setProcessStatus] = useState("");
  const [isCompliant, setIsCompliant] = useState(false);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [pdfCreated, setPdfCreated] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [isRevamping, setIsRevamping] = useState(false);
  const [originalTranscript, setOriginalTranscript] = useState("");

  /* ─────────────────────────────────────────────
     STEP 0: Compliance Check (future)
     ───────────────────────────────────────────── */
  const handleComplianceCheck = async (transcript) => {
    setIsProcessing(true);
    setError(null);
    setProcessStatus("Agent is reviewing for compliance...");

    const cleaned = cleanTranscript(transcript);

    try {
      const response = await fetch(COMPLIANCE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "Compliance Review", content: cleaned }),
      });

      if (!response.ok) throw new Error("Compliance check failed");

      const htmlContent = await response.text();
      await new Promise((r) => setTimeout(r, 1200));

      setIsCompliant(true);
      setComplianceSummary(htmlContent);
      setProcessStatus("Compliance verified. Ready for generation.");
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      setError("Compliance check encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  /* ─────────────────────────────────────────────
     STEP 1: Generate Story (Workflow 1)
     Sends transcript → gets formatted story text
     ───────────────────────────────────────────── */
  const handleGenerate = async ({ transcript, action }) => {
    setIsProcessing(true);
    setError(null);
    setCurrentAction(action);
    setPdfCreated(false);
    setProcessStatus("Cleaning transcript timestamps...");
    setOriginalTranscript(transcript);

    console.log("Action:", action);

    await new Promise((r) => setTimeout(r, 800));
    const cleaned = cleanTranscript(transcript);

    console.log(
      "Transcript preview (cleaned):",
      cleaned.substring(0, 100) + "...",
    );

    setProcessStatus("AI is analyzing story arcs...");

    try {
      console.log("Sending to Story Webhook:", STORY_WEBHOOK_URL);

      const response = await fetch(STORY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: cleaned,
          action: action,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response
          .clone()
          .text()
          .catch(() => "");
        if (errorText.includes("not registered for POST")) {
          throw new Error(
            "n8n Configuration Error: Webhook is set to GET. Change to POST.",
          );
        }
        if (errorText.includes("Unused Respond to Webhook")) {
          throw new Error(
            'n8n Configuration Error: Set Webhook "Respond" to "Using Respond to Webhook Node".',
          );
        }
        throw new Error(
          `Server responded with ${response.status}: ${errorText.substring(0, 200)}`,
        );
      }

      setProcessStatus("Story generated! Loading preview...");

      // Workflow 1 returns the generated story as text
      const storyText = await response.text();
      console.log("Story response length:", storyText.length);

      await new Promise((r) => setTimeout(r, 600));

      setResult(storyText);
    } catch (err) {
      console.error("Error generating story:", err);
      setError(`Failed to generate document: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  /* ─────────────────────────────────────────────
     STEP 2: Create PDF / Google Doc (Workflow 2)
     Sends the generated story → creates Google Doc
     ───────────────────────────────────────────── */
  const handleCreatePdf = async () => {
    setIsCreatingPdf(true);
    setError(null);
    setProcessStatus("Creating Google Doc...");

    try {
      console.log("Sending to PDF Webhook:", PDF_WEBHOOK_URL);
      console.log("Story content length:", result?.length);

      const isHtml =
        /^\s*<(!DOCTYPE|html|head|body|div|p|h[1-6]|table|section)/i.test(
          result,
        );
      const cleanedContent = isHtml ? stripHtml(result) : result;

      // Helper to detect show/client names for n8n classification
      const firstLine = cleanedContent.split("\n")[0] || "";
      const showMatch = firstLine.match(/^(.*?)\s+x\s+(.*)$/);
      const detectedShow = showMatch
        ? showMatch[1]
        : firstLine.includes("Cheat Sheet")
          ? "Women in Power"
          : "";
      const detectedClient = showMatch ? showMatch[2] : "";

      const response = await fetch(PDF_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: cleanedContent,
          transcript: originalTranscript,
          action: currentAction,
          show_name: detectedShow,
          client_name: detectedClient,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log("PDF response status:", response.status);

      if (!response.ok) {
        const errorText = await response
          .clone()
          .text()
          .catch(() => "");
        throw new Error(
          `PDF creation failed (${response.status}): ${errorText.substring(0, 200)}`,
        );
      }

      const responseText = await response.text();
      console.log("PDF webhook response:", responseText);

      await new Promise((r) => setTimeout(r, 500));
      setPdfCreated(true);
    } catch (err) {
      console.error("Error creating PDF:", err);
      setError(`Failed to create PDF: ${err.message}`);
    } finally {
      setIsCreatingPdf(false);
      setProcessStatus("");
    }
  };

  /* ─────────────────────────────────────────────
     STEP 3: Revise / Revamp (Workflow 3)
     Sends current story + instructions → gets revised story
     ───────────────────────────────────────────── */
  const handleRevise = async (instructions, actionOverride) => {
    setIsRevamping(true);
    setError(null);

    try {
      console.log("Sending to Edit Webhook:", EDIT_WEBHOOK_URL);

      const response = await fetch(EDIT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result,
          action: actionOverride,
          task: "edit",
          query: instructions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Revamp failed (${response.status})`);
      }

      const rawText = await response.text();
      console.log("Revamp response received, length:", rawText.length);
      console.log("Revamp response preview:", rawText.substring(0, 200));

      // n8n may return JSON or plain text — handle both
      let revisedText = rawText;
      try {
        const json = JSON.parse(rawText);
        // Extract text from common n8n response shapes
        revisedText =
          json.output ||
          json.text ||
          json.content ||
          json.message ||
          json.result ||
          JSON.stringify(json);
      } catch {
        // Response is plain text — use as-is
      }

      setResult(revisedText);
      setPdfCreated(false); // Content changed — allow creating a new PDF
    } catch (err) {
      console.error("Error revamping story:", err);
      // Log full error details for debugging
      console.log("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(`Failed to revamp story: ${err.message}`);
    } finally {
      setIsRevamping(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setCurrentAction(null);
    setIsCompliant(false);
    setComplianceSummary(null);
    setPdfCreated(false);
    setIsCreatingPdf(false);
  };

  return (
    <div className="min-h-screen bg-inside-dark relative overflow-x-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-inside-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-inside-gold/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <main className="container mx-auto px-6 py-12 relative z-10 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!result ? (
            <div key="form-view">
              <CastingForm
                onSubmit={handleGenerate}
                onComplianceCheck={handleComplianceCheck}
                isProcessing={isProcessing}
                isCompliant={isCompliant}
                complianceSummary={complianceSummary}
              />

              {/* Processing Overlay */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-inside-dark/80 backdrop-blur-md flex flex-col items-center justify-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-white/5 rounded-full" />
                    <Loader2 className="w-24 h-24 text-inside-gold animate-spin absolute top-0 left-0" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black gradient-text mb-2 uppercase tracking-tighter">
                      Processing Intelligence
                    </h3>
                    <p className="text-inside-accent/60 font-medium">
                      {processStatus}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div key="result-view">
              <ResultPreview
                result={result || ""}
                action={currentAction}
                onReset={reset}
                onCreatePdf={handleCreatePdf}
                isCreatingPdf={isCreatingPdf}
                pdfCreated={pdfCreated}
                onResetPdf={() => setPdfCreated(false)}
                onRevise={handleRevise}
                isRevamping={isRevamping}
                onManualEdit={setResult}
              />
            </div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[60] max-w-2xl"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-bold text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 hover:scale-110 transition-transform flex-shrink-0"
            >
              ✕
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-8 border-t border-white/5 text-center mt-auto relative z-10">
        <p className="text-xs font-bold text-inside-accent/30 tracking-[0.4em] uppercase">
          Powered by Inside Success Network & AI Engineering
        </p>
      </footer>
    </div>
  );
}

export default App;
