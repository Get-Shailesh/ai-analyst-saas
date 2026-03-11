"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar }  from "@/components/layout/TopBar";
import { Card }    from "@/components/ui/Card";
import { Button }  from "@/components/ui/Button";
import toast       from "react-hot-toast";

const SECTIONS = [
  { title:"AI Configuration", fields:[
    { label:"AI Model",       type:"select", opts:["claude-sonnet-4-6","gpt-4o","gemini-pro"],    key:"model" },
    { label:"Analysis Depth", type:"select", opts:["Quick Scan","Standard","Deep Dive"],          key:"depth" },
    { label:"Max Tokens",     type:"input",  placeholder:"4096",                                  key:"maxTokens" },
  ]},
  { title:"Data Settings", fields:[
    { label:"Default Chart Type",     type:"select", opts:["Area Chart","Bar Chart","Line Chart"], key:"chartType" },
    { label:"Max Rows per Upload",    type:"input",  placeholder:"1,000,000",                     key:"maxRows" },
    { label:"Auto-analyse on Upload", type:"toggle", key:"autoAnalyse" },
  ]},
  { title:"Notifications", fields:[
    { label:"Email on Analysis Complete", type:"toggle", key:"emailAlert" },
    { label:"Anomaly Alerts",             type:"toggle", key:"anomalyAlert" },
  ]},
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string,boolean>>({ autoAnalyse:true, emailAlert:true, anomalyAlert:false });
  const save = () => toast.success("Settings saved");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Settings" subtitle="Configure AI model, analysis preferences and notifications" />
        <main className="flex-1 overflow-y-auto p-7 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {SECTIONS.map((sec,si) => (
              <Card key={si}>
                <h3 className="text-dark-50 text-sm font-bold mb-4">{sec.title}</h3>
                <div className="space-y-4">
                  {sec.fields.map((f,fi) => (
                    <div key={fi}>
                      <label className="text-dark-200 text-[10px] font-semibold uppercase tracking-widest block mb-1.5">{f.label}</label>
                      {f.type === "toggle" ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => setToggles(t => ({...t, [f.key!]:!t[f.key!]}))}
                            className={`relative w-9 h-5 rounded-full transition-colors ${toggles[f.key!] ? "bg-brand" : "bg-dark-300"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-dark-600 transition-all ${toggles[f.key!] ? "left-4.5 translate-x-0.5" : "left-0.5"}`} style={{left: toggles[f.key!] ? "18px" : "2px"}} />
                          </button>
                          <span className={`text-xs font-semibold ${toggles[f.key!] ? "text-brand" : "text-dark-200"}`}>{toggles[f.key!] ? "Enabled" : "Disabled"}</span>
                        </div>
                      ) : f.type === "select" ? (
                        <select className="w-full bg-dark-500 border border-dark-300 rounded-lg px-3 py-2 text-dark-50 text-xs outline-none focus:border-brand/40 transition-colors">
                          {f.opts?.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder={f.placeholder}
                          className="w-full bg-dark-500 border border-dark-300 rounded-lg px-3 py-2 text-dark-50 text-xs outline-none focus:border-brand/40 transition-colors placeholder:text-dark-200" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <Button onClick={save} size="lg">Save Settings</Button>
        </main>
      </div>
    </div>
  );
}
