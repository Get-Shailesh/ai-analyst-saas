"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { datasetsApi } from "@/lib/api";
import { Copy, Check, Sparkles } from "lucide-react";

interface Formula {
  title: string;
  formula: string;
  description: string;
  category: string;
}

const CATEGORIES = [
  "All",
  "Statistics",
  "Lookup",
  "Conditional",
  "Text",
  "Date",
];

export default function ExcelPage() {
  const { activeDataset } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeDataset) return;
    setLoading(true);
    datasetsApi
      .getProfile(activeDataset.id)
      .then((r) => {
        const p = r.data.data;
        setProfile(p);
        const stats = p?.statistics || {};
        const allCols = Object.keys(stats);
        const numCols = allCols.filter((c) => stats[c]?.mean !== undefined);
        const txtCols = allCols.filter((c) => stats[c]?.mean === undefined);
        const n1 = numCols[0] || "A";
        const n2 = numCols[1] || "B";
        const t1 = txtCols[0] || "Category";
        const col = (name: string) => {
          const idx = allCols.indexOf(name);
          return idx >= 0 ? String.fromCharCode(65 + idx) : "A";
        };

        setFormulas([
          // Statistics
          {
            category: "Statistics",
            title: `Sum of ${n1}`,
            formula: `=SUM(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Total sum of all values in ${n1}`,
          },
          {
            category: "Statistics",
            title: `Average ${n1}`,
            formula: `=AVERAGE(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Mean value of ${n1}`,
          },
          {
            category: "Statistics",
            title: `Max ${n1}`,
            formula: `=MAX(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Highest value in ${n1}`,
          },
          {
            category: "Statistics",
            title: `Min ${n1}`,
            formula: `=MIN(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Lowest value in ${n1}`,
          },
          {
            category: "Statistics",
            title: `Std Dev ${n1}`,
            formula: `=STDEV(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Standard deviation of ${n1}`,
          },
          {
            category: "Statistics",
            title: `Count Rows`,
            formula: `=COUNTA(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Count non-empty rows`,
          },
          {
            category: "Statistics",
            title: `Median ${n1}`,
            formula: `=MEDIAN(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Median value of ${n1}`,
          },
          {
            category: "Statistics",
            title: `Variance ${n1}`,
            formula: `=VAR(${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Variance of ${n1}`,
          },
          // Lookup
          {
            category: "Lookup",
            title: `VLOOKUP ${t1}`,
            formula: `=VLOOKUP(A2,Sheet2!A:B,2,FALSE)`,
            description: `Look up ${t1} in another sheet`,
          },
          {
            category: "Lookup",
            title: `INDEX MATCH`,
            formula: `=INDEX(${col(n1)}:${col(n1)},MATCH(MAX(${col(n1)}:${col(n1)}),${col(n1)}:${col(n1)},0))`,
            description: `Find row with max ${n1}`,
          },
          {
            category: "Lookup",
            title: `XLOOKUP`,
            formula: `=XLOOKUP(A2,${col(t1)}:${col(t1)},${col(n1)}:${col(n1)},"Not found")`,
            description: `Modern lookup for ${t1}`,
          },
          {
            category: "Lookup",
            title: `COUNTIF`,
            formula: `=COUNTIF(${col(t1)}2:${col(t1)}${p.row_count || 1000},A2)`,
            description: `Count occurrences of each ${t1}`,
          },
          {
            category: "Lookup",
            title: `SUMIF`,
            formula: `=SUMIF(${col(t1)}2:${col(t1)}${p.row_count || 1000},A2,${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Sum ${n1} for each ${t1}`,
          },
          // Conditional
          {
            category: "Conditional",
            title: `Flag High Values`,
            formula: `=IF(${col(n1)}2>${Math.round(stats[n1]?.mean * 1.5 || 100)},"High","Normal")`,
            description: `Flag values above 1.5x mean`,
          },
          {
            category: "Conditional",
            title: `Flag Missing`,
            formula: `=IF(ISBLANK(${col(n1)}2),"Missing","OK")`,
            description: `Detect missing values in ${n1}`,
          },
          {
            category: "Conditional",
            title: `Above Average`,
            formula: `=IF(${col(n1)}2>AVERAGE(${col(n1)}$2:${col(n1)}$${p.row_count || 1000}),"Above","Below")`,
            description: `Compare to column average`,
          },
          {
            category: "Conditional",
            title: `AVERAGEIF`,
            formula: `=AVERAGEIF(${col(t1)}2:${col(t1)}${p.row_count || 1000},A2,${col(n1)}2:${col(n1)}${p.row_count || 1000})`,
            description: `Average ${n1} per ${t1} group`,
          },
          {
            category: "Conditional",
            title: `Percentile Rank`,
            formula: `=PERCENTRANK(${col(n1)}$2:${col(n1)}$${p.row_count || 1000},${col(n1)}2)`,
            description: `Rank each ${n1} as percentile`,
          },
          // Text
          {
            category: "Text",
            title: `Clean ${t1}`,
            formula: `=TRIM(PROPER(${col(t1)}2))`,
            description: `Clean and capitalise ${t1}`,
          },
          {
            category: "Text",
            title: `Concatenate`,
            formula: `=TEXTJOIN(" - ",TRUE,${col(t1)}2,${col(n1)}2)`,
            description: `Combine ${t1} and ${n1}`,
          },
          {
            category: "Text",
            title: `Extract First Word`,
            formula: `=LEFT(${col(t1)}2,FIND(" ",${col(t1)}2&" ")-1)`,
            description: `Get first word from ${t1}`,
          },
          {
            category: "Text",
            title: `Upper Case`,
            formula: `=UPPER(${col(t1)}2)`,
            description: `Convert ${t1} to uppercase`,
          },
          {
            category: "Text",
            title: `Count Characters`,
            formula: `=LEN(${col(t1)}2)`,
            description: `Count characters in ${t1}`,
          },
          // Date
          {
            category: "Date",
            title: `Today's Date`,
            formula: `=TODAY()`,
            description: `Insert today's date`,
          },
          {
            category: "Date",
            title: `Days Since`,
            formula: `=TODAY()-A2`,
            description: `Days since a date in column A`,
          },
          {
            category: "Date",
            title: `Year Extract`,
            formula: `=YEAR(A2)`,
            description: `Extract year from date`,
          },
          {
            category: "Date",
            title: `Month Name`,
            formula: `=TEXT(A2,"MMMM")`,
            description: `Get month name from date`,
          },
          {
            category: "Date",
            title: `Quarter`,
            formula: `=ROUNDUP(MONTH(A2)/3,0)`,
            description: `Get quarter number from date`,
          },
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeDataset]);

  const copyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopied(formula);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = formulas.filter(
    (f) =>
      (category === "All" || f.category === category) &&
      (search === "" ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Excel Formulas"
          subtitle={
            activeDataset
              ? `Formulas for: ${activeDataset.name}`
              : "Upload a dataset first"
          }
        />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          {!activeDataset && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-dark-50 font-bold mb-2">No dataset loaded</p>
              <p className="text-dark-200 text-sm">
                Go to Upload page to upload a CSV or Excel file
              </p>
            </Card>
          )}

          {loading && (
            <Card className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-dark-300 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-200 text-sm">Generating formulas...</p>
            </Card>
          )}

          {profile && !loading && (
            <>
              {/* Info */}
              <Card className="flex items-center gap-3 p-4">
                <Sparkles size={16} className="text-brand shrink-0" />
                <p className="text-dark-200 text-xs">
                  Formulas are generated based on your actual column names and
                  dataset size ({profile.row_count?.toLocaleString()} rows).
                  Click <span className="text-brand">Copy</span> to paste
                  directly into Excel or Google Sheets.
                </p>
              </Card>

              {/* Filters */}
              <div className="flex gap-3 items-center">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${category === c ? "bg-brand text-dark-600" : "bg-dark-500 border border-dark-300 text-dark-200 hover:text-dark-50"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search formulas..."
                  className="ml-auto bg-dark-500 border border-dark-300 rounded-lg px-3 py-1.5 text-dark-50 text-xs outline-none w-44 focus:border-brand/40"
                />
              </div>

              {/* Formula Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((f, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-dark-50 text-xs font-bold">
                          {f.title}
                        </p>
                        <p className="text-dark-200 text-[10px] mt-0.5">
                          {f.description}
                        </p>
                      </div>
                      <button
                        onClick={() => copyFormula(f.formula)}
                        className="text-dark-200 hover:text-brand p-1 rounded transition-colors shrink-0"
                      >
                        {copied === f.formula ? (
                          <Check size={13} className="text-brand" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                    <div className="bg-dark-500 rounded-lg px-3 py-2 mt-2">
                      <code className="text-brand text-[10px] font-mono break-all">
                        {f.formula}
                      </code>
                    </div>
                  </Card>
                ))}
              </div>

              {filtered.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-dark-200 text-sm">
                    No formulas found for your search.
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
