"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import { Play, Copy, Check } from "lucide-react";

const QUERY_TEMPLATES = [
  {
    label: "Row Count",
    sql: (t: string) => `SELECT COUNT(*) AS total_rows\nFROM ${t};`,
  },
  {
    label: "First 10 Rows",
    sql: (t: string) => `SELECT *\nFROM ${t}\nLIMIT 10;`,
  },
  {
    label: "Column Summary",
    sql: (t: string) =>
      `SELECT\n  COUNT(*) AS total_rows,\n  COUNT(*) FILTER (WHERE * IS NULL) AS missing\nFROM ${t};`,
  },
  {
    label: "Distinct Values",
    sql: (t: string, c: string) =>
      `SELECT ${c}, COUNT(*) AS count\nFROM ${t}\nGROUP BY ${c}\nORDER BY count DESC\nLIMIT 20;`,
  },
  {
    label: "Top 10 by Value",
    sql: (t: string, c: string) =>
      `SELECT *\nFROM ${t}\nORDER BY ${c} DESC\nLIMIT 10;`,
  },
  {
    label: "Average by Group",
    sql: (t: string, c: string, g: string) =>
      `SELECT ${g}, AVG(${c}) AS avg_value\nFROM ${t}\nGROUP BY ${g}\nORDER BY avg_value DESC;`,
  },
  {
    label: "Missing Values",
    sql: (t: string, c: string) =>
      `SELECT COUNT(*) AS missing_count\nFROM ${t}\nWHERE ${c} IS NULL;`,
  },
  {
    label: "Min / Max / Avg",
    sql: (t: string, c: string) =>
      `SELECT\n  MIN(${c}) AS min_val,\n  MAX(${c}) AS max_val,\n  AVG(${c}) AS avg_val,\n  STDDEV(${c}) AS std_dev\nFROM ${t};`,
  },
];

export default function SQLPage() {
  const { activeDataset } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [ran, setRan] = useState(false);

  const tableName = activeDataset?.name
    ? activeDataset.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase()
    : "your_table";

  useEffect(() => {
    if (!activeDataset) return;
    datasetsApi
      .getProfile(activeDataset.id)
      .then((r) => {
        const stats = r.data.data?.statistics || {};
        setProfile(r.data.data);
        setCols(Object.keys(stats));
        const numCols = Object.keys(stats).filter(
          (c) => stats[c]?.mean !== undefined,
        );
        const txtCols = Object.keys(stats).filter(
          (c) => stats[c]?.mean === undefined,
        );
        const firstNum = numCols[0] || "value";
        const firstTxt = txtCols[0] || "category";
        setQuery(`SELECT *\nFROM ${tableName}\nLIMIT 10;`);
      })
      .catch(() => {});
  }, [activeDataset]);

  const runQuery = () => {
    if (!query.trim() || !profile) return;
    setRan(true);
    const stats = profile.statistics || {};
    const allCols = Object.keys(stats);
    const numCols = allCols.filter((c) => stats[c]?.mean !== undefined);

    // Simulate query results based on real stats
    if (query.toLowerCase().includes("count(*)")) {
      setResults([{ result: profile.row_count?.toLocaleString() || "?" }]);
    } else if (
      query.toLowerCase().includes("min(") ||
      query.toLowerCase().includes("max(") ||
      query.toLowerCase().includes("avg(")
    ) {
      const col = numCols[0];
      if (col) {
        setResults([
          {
            min_val: stats[col]?.min,
            max_val: stats[col]?.max,
            avg_val: stats[col]?.mean?.toFixed(2),
            std_dev: stats[col]?.std?.toFixed(2),
          },
        ]);
      }
    } else if (query.toLowerCase().includes("group by")) {
      setResults(
        numCols.slice(0, 5).map((col) => ({
          group: col,
          avg_value: stats[col]?.mean?.toFixed(2),
        })),
      );
    } else {
      // Generic — show column stats as rows
      setResults(
        allCols.slice(0, 10).map((col) => ({
          column: col,
          type: stats[col]?.mean !== undefined ? "numeric" : "text",
          mean: stats[col]?.mean ?? "—",
          min: stats[col]?.min ?? "—",
          max: stats[col]?.max ?? "—",
        })),
      );
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (t: any) => {
    const stats = profile?.statistics || {};
    const allCols = Object.keys(stats);
    const numCols = allCols.filter((c) => stats[c]?.mean !== undefined);
    const txtCols = allCols.filter((c) => stats[c]?.mean === undefined);
    const firstNum = numCols[0] || "value";
    const firstTxt = txtCols[0] || "category";
    setQuery(t.sql(tableName, firstNum, firstTxt));
    setResults([]);
    setRan(false);
  };

  const resultCols = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="SQL Query"
          subtitle={
            activeDataset ? `Table: ${tableName}` : "Upload a dataset first"
          }
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">🗄️</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {activeDataset && (
            <>
              {/* Templates */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Query Templates
                </h3>
                <div className="flex flex-wrap gap-2">
                  {QUERY_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t)}
                      className="bg-dark-500 border border-dark-300 text-dark-200 hover:text-dark-50 hover:border-brand/30 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Editor */}
              <Card>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-dark-50 text-sm font-bold">SQL Editor</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyQuery}
                      className="text-dark-200 hover:text-dark-50 p-1.5 rounded transition-colors"
                    >
                      {copied ? (
                        <Check size={14} className="text-brand" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <Button onClick={runQuery} size="sm">
                      <Play size={12} className="mr-1.5" /> Run Query
                    </Button>
                  </div>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-32 bg-dark-500 border border-dark-300 rounded-lg p-3 text-brand text-xs font-mono outline-none resize-none focus:border-brand/40 leading-relaxed"
                  spellCheck={false}
                />
                <p className="text-dark-200 text-[10px] mt-2">
                  💡 This is a query simulator — results are based on real
                  dataset statistics. Copy the SQL to use in your actual
                  database.
                </p>
              </Card>

              {/* Schema */}
              {cols.length > 0 && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-3">
                    Table Schema —{" "}
                    <span className="text-brand">{tableName}</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {cols.map((col) => {
                      const s = profile?.statistics?.[col];
                      const isNum = s?.mean !== undefined;
                      return (
                        <div
                          key={col}
                          className="bg-dark-500 rounded-lg px-3 py-2 flex items-center gap-2"
                        >
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isNum ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}
                          >
                            {isNum ? "NUM" : "TXT"}
                          </span>
                          <span className="text-dark-50 text-xs truncate">
                            {col}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Results */}
              {ran && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-3">
                    Query Results — {results.length} row
                    {results.length !== 1 ? "s" : ""}
                  </h3>
                  {results.length === 0 ? (
                    <p className="text-dark-200 text-xs">
                      No results returned.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            {resultCols.map((c) => (
                              <th
                                key={c}
                                className="text-left px-3 py-2 border-b border-dark-300 text-dark-200 font-semibold uppercase text-[10px]"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((row, i) => (
                            <tr
                              key={i}
                              className={i % 2 === 0 ? "" : "bg-dark-500/40"}
                            >
                              {resultCols.map((c) => (
                                <td
                                  key={c}
                                  className="px-3 py-2 border-b border-dark-300/20 text-dark-50"
                                >
                                  {String(row[c] ?? "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
