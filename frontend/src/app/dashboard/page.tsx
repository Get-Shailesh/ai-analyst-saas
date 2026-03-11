"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { activeDataset } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;
    setLoading(true);
    datasetsApi
      .getProfile(activeDataset.id)
      .then((r) => setProfile(r.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [activeDataset]);

  const stats = profile?.statistics || {};
  const cols = Object.keys(stats);
  const numCols = cols.filter((c) => stats[c]?.mean !== undefined);

  const chartData =
    numCols.slice(0, 1).length > 0
      ? Array.from({ length: 6 }, (_, i) => ({
          name: `P${i + 1}`,
          ...numCols.slice(0, 3).reduce(
            (acc, col) => ({
              ...acc,
              [col]: Math.round(
                (stats[col]?.mean || 0) * (0.8 + Math.random() * 0.4),
              ),
            }),
            {},
          ),
        }))
      : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Dashboard"
          subtitle={
            activeDataset
              ? `Dataset: ${activeDataset.name}`
              : "Upload a dataset to begin"
          }
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
              <p className="text-dark-200 text-sm">
                Loading dataset profile...
              </p>
            </Card>
          )}

          {profile && !loading && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-3">
                <Card className="p-4">
                  <p className="text-dark-200 text-xs mb-1">Total Rows</p>
                  <p className="text-brand text-2xl font-extrabold">
                    {profile.row_count?.toLocaleString() || 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-dark-200 text-xs mb-1">Columns</p>
                  <p className="text-purple-400 text-2xl font-extrabold">
                    {profile.column_count || 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-dark-200 text-xs mb-1">Missing Values</p>
                  <p className="text-yellow-400 text-2xl font-extrabold">
                    {profile.missing_values?.toLocaleString() || 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-dark-200 text-xs mb-1">Numeric Columns</p>
                  <p className="text-blue-400 text-2xl font-extrabold">
                    {numCols.length}
                  </p>
                </Card>
              </div>

              {/* Column Stats */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Column Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {[
                          "Column",
                          "Type",
                          "Mean",
                          "Min",
                          "Max",
                          "Std Dev",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 border-b border-dark-300 text-dark-200 font-semibold text-[10px] uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cols.slice(0, 10).map((col, i) => (
                        <tr
                          key={col}
                          className={i % 2 === 0 ? "" : "bg-dark-500/30"}
                        >
                          <td className="px-3 py-2 text-dark-50 font-semibold">
                            {col}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                stats[col]?.mean !== undefined
                                  ? "blue"
                                  : "purple"
                              }
                              className="text-[9px]"
                            >
                              {stats[col]?.mean !== undefined
                                ? "NUMBER"
                                : "TEXT"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-dark-200">
                            {stats[col]?.mean?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-dark-200">
                            {stats[col]?.min?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-dark-200">
                            {stats[col]?.max?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-dark-200">
                            {stats[col]?.std?.toLocaleString() ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Chart */}
              {chartData.length > 0 && numCols.length > 0 && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-3">
                    Numeric Column Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#00F5A0"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#00F5A0"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6B6B8A", fontSize: 10 }}
                      />
                      <YAxis tick={{ fill: "#6B6B8A", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#12121A",
                          border: "1px solid #2A2A3E",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      {numCols.slice(0, 1).map((col) => (
                        <Area
                          key={col}
                          type="monotone"
                          dataKey={col}
                          stroke="#00F5A0"
                          fill="url(#g1)"
                          strokeWidth={2}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Dataset Info */}
              <Card>
                <h3 className="text-dark-50 text-sm font-bold mb-3">
                  Dataset Info
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-500 rounded-lg p-3">
                    <p className="text-dark-200 text-xs mb-1">File Name</p>
                    <p className="text-dark-50 text-sm font-semibold">
                      {activeDataset?.name}
                    </p>
                  </div>
                  <div className="bg-dark-500 rounded-lg p-3">
                    <p className="text-dark-200 text-xs mb-1">File Size</p>
                    <p className="text-dark-50 text-sm font-semibold">
                      {activeDataset?.size
                        ? `${(activeDataset.size / 1024).toFixed(1)} KB`
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-dark-500 rounded-lg p-3">
                    <p className="text-dark-200 text-xs mb-1">Text Columns</p>
                    <p className="text-dark-50 text-sm font-semibold">
                      {cols
                        .filter((c) => stats[c]?.mean === undefined)
                        .join(", ") || "None"}
                    </p>
                  </div>
                  <div className="bg-dark-500 rounded-lg p-3">
                    <p className="text-dark-200 text-xs mb-1">
                      Numeric Columns
                    </p>
                    <p className="text-dark-50 text-sm font-semibold">
                      {numCols.join(", ") || "None"}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
