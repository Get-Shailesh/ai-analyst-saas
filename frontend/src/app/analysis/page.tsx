"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from "lucide-react";

const SEVERITY_CONFIG: Record<
  string,
  { color: string; icon: any; badge: any }
> = {
  critical: {
    color: "border-red-500/30 bg-red-500/5",
    icon: AlertTriangle,
    badge: "red",
  },
  warning: {
    color: "border-yellow-500/30 bg-yellow-500/5",
    icon: AlertTriangle,
    badge: "yellow",
  },
  positive: {
    color: "border-green-500/30 bg-green-500/5",
    icon: TrendingUp,
    badge: "green",
  },
  info: {
    color: "border-blue-500/30 bg-blue-500/5",
    icon: Info,
    badge: "blue",
  },
};

export default function AnalysisPage() {
  const { activeDataset } = useAppStore();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const runAnalysis = async () => {
    if (!activeDataset) return;
    setLoading(true);
    setRan(true);
    try {
      const res = await datasetsApi.getProfile(activeDataset.id);
      const profile = res.data.data;
      const stats = profile?.statistics || {};
      const cols = Object.keys(stats);
      const numCols = cols.filter((c) => stats[c]?.mean !== undefined);

      const generated: any[] = [];

      generated.push({
        id: "overview",
        severity: "info",
        title: "Dataset Overview",
        detail: `Your dataset contains ${profile.row_count?.toLocaleString() || "?"} rows and ${profile.column_count || cols.length} columns. Missing values: ${profile.missing_values || 0}.`,
        confidence: 1.0,
        action: "Review missing values before drawing conclusions.",
      });

      for (const col of numCols.slice(0, 8)) {
        const s = stats[col];
        const trend = s.max > s.mean * 1.5 ? "high variance" : "stable";
        const severity = s.min < 0 ? "warning" : "positive";
        generated.push({
          id: `stat_${col}`,
          severity,
          title: `${col} Analysis`,
          detail: `Mean: ${s.mean?.toLocaleString()}, Min: ${s.min?.toLocaleString()}, Max: ${s.max?.toLocaleString()}, Std Dev: ${s.std?.toLocaleString()}. Distribution appears ${trend}.`,
          confidence: 0.88,
          action:
            s.min < 0
              ? `Investigate negative values in ${col}.`
              : `${col} looks healthy — continue monitoring.`,
        });
      }

      for (const col of cols
        .filter((c) => stats[c]?.mean === undefined)
        .slice(0, 3)) {
        const s = stats[col];
        generated.push({
          id: `text_${col}`,
          severity: "info",
          title: `${col} — Text Column`,
          detail: `Unique values: ${s?.unique_count || "?"}, Most common: "${s?.most_common || "?"}" (${s?.most_common_count || "?"} times).`,
          confidence: 0.82,
          action: `Consider encoding ${col} for ML models.`,
        });
      }

      setInsights(generated);
    } catch {
      setInsights([
        {
          id: "error",
          severity: "warning",
          title: "Analysis Error",
          detail:
            "Could not load dataset profile. Please make sure your file is uploaded correctly.",
          confidence: 0,
          action: "Try re-uploading your file.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDataset) runAnalysis();
  }, [activeDataset]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="AI Analysis"
          subtitle={
            activeDataset
              ? `Analysing: ${activeDataset.name}`
              : "Upload a dataset first"
          }
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {activeDataset && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-dark-50 font-bold">{activeDataset.name}</p>
                <p className="text-dark-200 text-xs">
                  {insights.length} insights generated
                </p>
              </div>
              <Button onClick={runAnalysis} loading={loading} size="sm">
                <Sparkles size={14} className="mr-2" /> Re-run Analysis
              </Button>
            </div>
          )}

          {loading && (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-200 text-sm">Analysing your dataset...</p>
            </Card>
          )}

          {!loading && ran && insights.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-dark-200 text-sm">
                No insights generated. Try re-running the analysis.
              </p>
            </Card>
          )}

          {!loading &&
            insights.map((insight) => {
              const cfg =
                SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <Card key={insight.id} className={`border ${cfg.color}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={16} className="mt-0.5 shrink-0 text-dark-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-dark-50 text-sm font-bold">
                          {insight.title}
                        </p>
                        <Badge
                          variant={cfg.badge as any}
                          className="text-[9px]"
                        >
                          {insight.severity.toUpperCase()}
                        </Badge>
                        <span className="text-dark-200 text-[10px] ml-auto">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-dark-200 text-xs leading-relaxed mb-2">
                        {insight.detail}
                      </p>
                      <div className="bg-dark-500 rounded-lg px-3 py-2">
                        <p className="text-brand text-[10px] font-semibold">
                          💡 {insight.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </main>
      </div>
    </div>
  );
}
