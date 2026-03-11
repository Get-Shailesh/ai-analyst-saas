"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import { Download, FileText, Sparkles } from "lucide-react";

export default function ReportsPage() {
  const { activeDataset } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!activeDataset) return;
    setLoading(true);
    datasetsApi
      .getProfile(activeDataset.id)
      .then((r) => setProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDataset]);

  const generateReport = () => {
    if (!profile) return;
    setGenLoading(true);
    setTimeout(() => {
      const stats = profile.statistics || {};
      const cols = Object.keys(stats);
      const numCols = cols.filter((c) => stats[c]?.mean !== undefined);
      const txtCols = cols.filter((c) => stats[c]?.mean === undefined);

      const findings = numCols.slice(0, 5).map((col) => {
        const s = stats[col];
        const health =
          s.min < 0
            ? "⚠️ Contains negative values"
            : s.std > s.mean
              ? "⚠️ High variance"
              : "✅ Looks healthy";
        return { col, ...s, health };
      });

      setReport({
        title: `Analysis Report — ${activeDataset?.name}`,
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        summary: `This report analyses ${profile.row_count?.toLocaleString() || "?"} rows and ${profile.column_count || cols.length} columns. The dataset contains ${numCols.length} numeric and ${txtCols.length} text columns with ${profile.missing_values || 0} missing values.`,
        findings,
        recommendations: [
          profile.missing_values > 0
            ? `Address ${profile.missing_values} missing values to improve accuracy.`
            : null,
          numCols.some((c) => stats[c]?.min < 0)
            ? "Investigate columns with negative values."
            : null,
          numCols.some((c) => stats[c]?.std > stats[c]?.mean)
            ? "Review high-variance columns for outliers."
            : null,
          "Regularly monitor key metrics for drift.",
          "Consider normalising numeric columns before ML modelling.",
        ].filter(Boolean),
      });
      setGenLoading(false);
    }, 800);
  };

  const downloadReport = () => {
    if (!report) return;
    const lines = [
      report.title,
      `Generated: ${report.date}`,
      "",
      "EXECUTIVE SUMMARY",
      report.summary,
      "",
      "KEY FINDINGS",
      ...report.findings.map(
        (f: any) =>
          `${f.col}: Mean=${f.mean}, Min=${f.min}, Max=${f.max}, StdDev=${f.std} — ${f.health}`,
      ),
      "",
      "RECOMMENDATIONS",
      ...report.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${activeDataset?.name || "dataset"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Reports"
          subtitle="Generate and download analysis reports"
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">📄</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {loading && (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-200 text-sm">Loading dataset info...</p>
            </Card>
          )}

          {profile && !loading && !report && (
            <Card className="p-8 text-center">
              <FileText size={40} className="text-dark-200 mx-auto mb-4" />
              <p className="text-dark-50 font-bold mb-2">
                Ready to generate report
              </p>
              <p className="text-dark-200 text-sm mb-6">
                Dataset:{" "}
                <span className="text-brand">{activeDataset?.name}</span> —{" "}
                {profile.row_count?.toLocaleString()} rows,{" "}
                {profile.column_count} columns
              </p>
              <Button onClick={generateReport} loading={genLoading} size="lg">
                <Sparkles size={14} className="mr-2" /> Generate Report
              </Button>
            </Card>
          )}

          {report && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-dark-50 font-bold">{report.title}</p>
                  <p className="text-dark-200 text-xs">
                    Generated: {report.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={generateReport}
                    loading={genLoading}
                    size="sm"
                    variant="secondary"
                  >
                    <Sparkles size={14} className="mr-2" /> Regenerate
                  </Button>
                  <Button onClick={downloadReport} size="sm">
                    <Download size={14} className="mr-2" /> Download
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-2">
                  Executive Summary
                </h3>
                <p className="text-dark-200 text-xs leading-relaxed">
                  {report.summary}
                </p>
              </Card>

              {/* Findings */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Key Findings
                </h3>
                <div className="space-y-2">
                  {report.findings.map((f: any) => (
                    <div
                      key={f.col}
                      className="bg-dark-500 rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-dark-50 text-xs font-bold mb-1">
                          {f.col}
                        </p>
                        <p className="text-dark-200 text-[10px]">
                          Mean: {f.mean?.toLocaleString()} · Min:{" "}
                          {f.min?.toLocaleString()} · Max:{" "}
                          {f.max?.toLocaleString()} · StdDev:{" "}
                          {f.std?.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={f.health.startsWith("✅") ? "green" : "yellow"}
                        className="text-[9px] shrink-0"
                      >
                        {f.health.startsWith("✅") ? "HEALTHY" : "REVIEW"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {report.recommendations.map((r: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-dark-500 rounded-lg p-3"
                    >
                      <span className="text-brand font-bold text-xs shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-dark-200 text-xs leading-relaxed">
                        {r}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
