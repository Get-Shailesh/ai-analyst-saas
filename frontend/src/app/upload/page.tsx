"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { Card }      from "@/components/ui/Card";
import { Button }    from "@/components/ui/Button";
import { Badge }     from "@/components/ui/Badge";
import { useDataset } from "@/hooks/useDataset";
import { useAppStore } from "@/store/useAppStore";
import { CloudUpload, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const STEPS = ["Upload File", "Define Problem", "Run Analysis"];

const PROBLEM_SUGGESTIONS = [
  "Why are sales dropping in Region A?",
  "Find factors affecting customer churn",
  "Predict next quarter revenue",
  "Which region needs more marketing budget?",
  "Identify top performing products",
];

export default function UploadPage() {
  const router  = useRouter();
  const { upload, uploading, uploadPct, error } = useDataset();
  const { setActiveDataset } = useAppStore();

  const [step,    setStep]    = useState(1);
  const [problem, setProblem] = useState("");
  const [running, setRunning] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const dataset = await upload(files[0]);
    if (dataset) {
      setActiveDataset(dataset);
      setStep(2);
      toast.success(`${dataset.name} uploaded successfully`);
    }
  }, [upload, setActiveDataset]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  const handleRun = async () => {
    if (!problem.trim()) { toast.error("Please describe your business problem"); return; }
    setRunning(true);
    // Trigger analysis job then navigate
    setTimeout(() => { router.push("/analysis"); }, 500);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Upload Dataset" subtitle="Upload CSV or Excel to begin AI analysis"/>
        <main className="flex-1 overflow-y-auto p-7">

          {/* Step indicator */}
          <div className="flex mb-7">
            {STEPS.map((s, i) => (
              <div key={i} className={[
                "flex-1 flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border transition-all",
                step > i
                  ? "bg-brand/20 border-brand text-brand"
                  : "bg-dark-400 border-dark-300 text-dark-200",
                i === 0 ? "rounded-l-lg" : i === 2 ? "rounded-r-lg" : "border-l-0 border-r-0",
              ].join(" ")}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i ? "bg-brand text-dark-600" : "bg-dark-300 text-dark-200"}`}>
                  {i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <Card className="mb-4">
            <div {...getRootProps()} className={[
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
              isDragActive    ? "border-brand bg-brand/5"      : "",
              acceptedFiles.length ? "border-brand/60 bg-brand/5" : "border-dark-300 hover:border-dark-200",
            ].join(" ")}>
              <input {...getInputProps()}/>
              {uploading ? (
                <div>
                  <div className="w-10 h-10 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-4"/>
                  <p className="text-dark-200 text-sm">Uploading... {uploadPct}%</p>
                  <div className="w-48 h-1.5 bg-dark-300 rounded-full mx-auto mt-2">
                    <div className="h-full bg-brand rounded-full transition-all" style={{ width: uploadPct+"%" }}/>
                  </div>
                </div>
              ) : acceptedFiles.length ? (
                <div>
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-brand font-bold">{acceptedFiles[0].name}</p>
                  <p className="text-dark-200 text-xs mt-1">Ready to analyze</p>
                </div>
              ) : (
                <div>
                  <CloudUpload size={40} className="text-dark-200 mx-auto mb-4"/>
                  <p className="text-dark-50 font-bold text-base mb-2">Drop CSV or Excel file here</p>
                  <p className="text-dark-200 text-sm mb-3">or click to browse · Max 100MB</p>
                  <div className="flex justify-center gap-2">
                    {[".csv",".xlsx",".xls"].map(t => <Badge key={t} variant="gray">{t}</Badge>)}
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          </Card>

          {!acceptedFiles.length && (
            <div className="text-center mb-4">
              <button onClick={() => { setStep(2); }}
                className="text-purple-500 border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-500/20 transition-all">
                <Sparkles size={14} className="inline mr-2"/>Use Demo Dataset
              </button>
            </div>
          )}

          {step >= 2 && (
            <Card glow className="mb-4">
              <h3 className="text-dark-50 font-bold text-sm mb-3">What business problem do you want to solve?</h3>
              <textarea
                value={problem}
                onChange={e => { setProblem(e.target.value); setStep(3); }}
                placeholder="e.g. Why are sales dropping in Region A? What factors are driving churn?"
                className="w-full min-h-[90px] bg-dark-500 border border-dark-300 rounded-lg p-3 text-dark-50 text-sm outline-none resize-y leading-relaxed placeholder:text-dark-200 focus:border-brand/40 transition-colors"
              />
              <div className="mt-3">
                <p className="text-dark-200 text-xs mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {PROBLEM_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => { setProblem(s); setStep(3); }}
                      className="text-dark-200 bg-dark-500 border border-dark-300 px-3 py-1.5 rounded-lg text-xs hover:border-brand/30 hover:text-dark-50 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {step >= 3 && (
            <Button onClick={handleRun} loading={running} size="lg" className="w-full">
              Run AI Analysis
            </Button>
          )}

        </main>
      </div>
    </div>
  );
}
