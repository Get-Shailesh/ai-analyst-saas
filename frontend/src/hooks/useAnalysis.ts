import { useState, useCallback, useRef } from "react";
import { analysisApi } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { AnalysisRequest, AnalysisResult } from "@/types";

export function useAnalysis() {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [step,     setStep]     = useState("");
  const pollRef = useRef<NodeJS.Timeout>();

  const { setCurrentAnalysis, addAnalysis } = useAppStore();

  // Poll job status until done
  const pollStatus = useCallback((analysisId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await analysisApi.status(analysisId);
        setProgress(data.data.progress);
        setStep(data.data.currentStep);

        if (data.data.status === "completed") {
          clearInterval(pollRef.current);
          const result = await analysisApi.get(analysisId);
          setCurrentAnalysis(result.data.data);
          addAnalysis(result.data.data);
          setLoading(false);
        } else if (data.data.status === "failed") {
          clearInterval(pollRef.current);
          setError("Analysis failed. Please try again.");
          setLoading(false);
        }
      } catch {
        clearInterval(pollRef.current);
        setError("Failed to get analysis status.");
        setLoading(false);
      }
    }, 1500);
  }, [setCurrentAnalysis, addAnalysis]);

  const runAnalysis = useCallback(async (req: AnalysisRequest) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setStep("Initializing...");

    try {
      const { data } = await analysisApi.run(req);
      pollStatus(data.data.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to start analysis.";
      setError(msg);
      setLoading(false);
    }
  }, [pollStatus]);

  const cancel = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLoading(false);
  }, []);

  return { runAnalysis, cancel, loading, error, progress, step };
}
