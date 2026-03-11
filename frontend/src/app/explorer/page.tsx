"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";

export default function ExplorerPage() {
  const { activeDataset } = useAppStore();
  const [preview, setPreview] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!activeDataset) return;
    setLoading(true);
    Promise.all([
      datasetsApi.getPreview(activeDataset.id),
      datasetsApi.getProfile(activeDataset.id),
    ])
      .then(([prevRes, profRes]) => {
        const pd = prevRes.data.data;
        setPreview(Array.isArray(pd) ? { rows: pd } : pd);
        setProfile(profRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDataset]);

  const rows: any[] = preview?.rows ?? [];
  const cols: string[] =
    preview?.columns ??
    (rows.length > 0
      ? Object.keys(rows[0]).filter((k) => {
          const v = rows[0][k];
          return typeof v !== "object" || v === null;
        })
      : []);
  const stats = profile?.statistics || {};

  const filteredRows = rows.filter((row: any) =>
    Object.values(row).some((v) =>
      String(v).toLowerCase().includes(filter.toLowerCase()),
    ),
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Dataset Explorer"
          subtitle="Browse and filter your raw data"
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {loading && (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-200 text-sm">Loading data...</p>
            </Card>
          )}

          {preview && !loading && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <Card className="p-4 flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-dark-50 text-lg font-extrabold leading-none">
                      {String(profile?.row_count || rows.length)}
                    </p>
                    <p className="text-dark-200 text-xs mt-0.5">Rows</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="text-dark-50 text-lg font-extrabold leading-none">
                      {String(cols.length)}
                    </p>
                    <p className="text-dark-200 text-xs mt-0.5">Columns</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-dark-50 text-lg font-extrabold leading-none">
                      {String(profile?.missing_values || 0)}
                    </p>
                    <p className="text-dark-200 text-xs mt-0.5">Missing</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                  <span className="text-xl">💾</span>
                  <div>
                    <p className="text-dark-50 text-lg font-extrabold leading-none">
                      {activeDataset?.file_size
                        ? `${(activeDataset.file_size / 1024).toFixed(1)} KB`
                        : activeDataset?.size
                          ? `${(activeDataset.size / 1024).toFixed(1)} KB`
                          : `${rows.length} rows`}
                    </p>
                    <p className="text-dark-200 text-xs mt-0.5">Size</p>
                  </div>
                </Card>
              </div>

              {/* Schema */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Column Schema
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cols.map((col: string) => (
                    <div
                      key={col}
                      className="bg-dark-500 rounded-lg px-3 py-2 text-center min-w-[90px]"
                    >
                      <p className="text-dark-50 text-xs font-bold mb-1">
                        {col}
                      </p>
                      <Badge
                        variant={
                          stats[col]?.mean !== undefined ? "blue" : "purple"
                        }
                        className="text-[9px]"
                      >
                        {stats[col]?.mean !== undefined ? "NUMBER" : "TEXT"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Table */}
              <Card>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-dark-50 text-sm font-bold">
                    Data Preview — {filteredRows.length} rows
                  </h3>
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter rows..."
                    className="bg-dark-500 border border-dark-300 rounded-lg px-3 py-1.5 text-dark-50 text-xs outline-none w-44 focus:border-brand/40"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {cols.map((col: string) => (
                          <th
                            key={col}
                            className="text-left px-3 py-2 border-b border-dark-300 text-dark-200 font-semibold uppercase tracking-wide text-[10px]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, 100).map((row: any, i: number) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? "" : "bg-dark-500/40"}
                        >
                          {cols.map((col: string) => (
                            <td
                              key={col}
                              className="px-3 py-2 border-b border-dark-300/20 text-dark-50"
                            >
                              {String(row[col] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
