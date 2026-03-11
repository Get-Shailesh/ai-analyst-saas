"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ChartsPage() {
  const { activeDataset } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;
    setLoading(true);
    Promise.all([
      datasetsApi.getProfile(activeDataset.id),
      datasetsApi.getPreview(activeDataset.id),
    ])
      .then(([profRes, prevRes]) => {
        setProfile(profRes.data.data);
        const pd = prevRes.data.data;
        setPreview(Array.isArray(pd) ? { rows: pd } : pd);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDataset]);

  const stats = profile?.statistics || {};
  const rows = preview?.rows ?? [];
  const numCols = Object.keys(stats).filter(
    (c) => stats[c]?.mean !== undefined,
  );
  const txtCols = Object.keys(stats).filter(
    (c) => stats[c]?.mean === undefined,
  );

  // Distribution chart data — use real row values for first numeric col
  const distData = numCols.slice(0, 1).flatMap((col) => {
    const vals = rows.slice(0, 30).map((r: any, i: number) => ({
      name: `R${i + 1}`,
      [col]: typeof r[col] === "number" ? r[col] : parseFloat(r[col]) || 0,
    }));
    return vals;
  });

  // Bar chart — mean values per numeric column
  const barData = numCols.slice(0, 8).map((col) => ({
    name: col.length > 12 ? col.slice(0, 12) + "…" : col,
    mean: Math.round(stats[col]?.mean || 0),
    max: Math.round(stats[col]?.max || 0),
    min: Math.round(Math.abs(stats[col]?.min || 0)),
  }));

  // Scatter — first two numeric cols
  const scatterData =
    numCols.length >= 2
      ? rows.slice(0, 50).map((r: any) => ({
          x: parseFloat(r[numCols[0]]) || 0,
          y: parseFloat(r[numCols[1]]) || 0,
        }))
      : [];

  // Category distribution — first text col
  const catData = (() => {
    if (!txtCols[0]) return [];
    const counts: Record<string, number> = {};
    rows.forEach((r: any) => {
      const v = String(r[txtCols[0]] ?? "Unknown");
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        name: name.length > 14 ? name.slice(0, 14) + "…" : name,
        count,
      }));
  })();

  const COLORS = ["#00F5A0", "#7C3AED", "#3B82F6", "#F59E0B", "#EF4444"];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Charts"
          subtitle={
            activeDataset
              ? `Visualising: ${activeDataset.name}`
              : "Upload a dataset first"
          }
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">📈</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {loading && (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-200 text-sm">Loading charts...</p>
            </Card>
          )}

          {profile && !loading && (
            <>
              {/* Area Chart */}
              {distData.length > 0 && numCols[0] && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-4">
                    {numCols[0]} — Value Distribution (first 30 rows)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={distData}>
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
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                      />
                      <YAxis tick={{ fill: "#6B6B8A", fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#12121A",
                          border: "1px solid #2A2A3E",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={numCols[0]}
                        stroke="#00F5A0"
                        fill="url(#g1)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Bar Chart */}
              {barData.length > 0 && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-4">
                    Numeric Columns — Mean / Min / Max
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                      />
                      <YAxis tick={{ fill: "#6B6B8A", fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#12121A",
                          border: "1px solid #2A2A3E",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 10, color: "#6B6B8A" }}
                      />
                      <Bar
                        dataKey="mean"
                        fill="#00F5A0"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="max" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="min" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Scatter Chart */}
              {scatterData.length > 0 && numCols.length >= 2 && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-4">
                    {numCols[0]} vs {numCols[1]} — Scatter Plot
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                      <XAxis
                        dataKey="x"
                        name={numCols[0]}
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                      />
                      <YAxis
                        dataKey="y"
                        name={numCols[1]}
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#12121A",
                          border: "1px solid #2A2A3E",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        cursor={{ strokeDasharray: "3 3" }}
                      />
                      <Scatter
                        data={scatterData}
                        fill="#00F5A0"
                        opacity={0.7}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Category Bar */}
              {catData.length > 0 && (
                <Card>
                  <h3 className="text-dark-50 text-sm font-bold mb-4">
                    {txtCols[0]} — Category Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={catData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                      <XAxis
                        type="number"
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#6B6B8A", fontSize: 9 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#12121A",
                          border: "1px solid #2A2A3E",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#7C3AED"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {numCols.length === 0 && catData.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-dark-200 text-sm">
                    No chartable data found in your dataset.
                  </p>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
