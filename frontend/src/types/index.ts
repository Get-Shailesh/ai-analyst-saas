// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── Dataset ───────────────────────────────────────────────────────────────────
export interface Dataset {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnSchema[];
  uploadedAt: string;
  status: "uploading" | "processing" | "ready" | "error";
}

export interface ColumnSchema {
  name: string;
  dtype: "string" | "integer" | "float" | "datetime" | "boolean";
  nullCount: number;
  uniqueCount: number;
  sampleValues: unknown[];
}

export interface DataProfile {
  rowCount: number;
  columnCount: number;
  missingValues: Record<string, number>;
  columnTypes: Record<string, string>;
  statistics: Record<string, ColumnStats>;
  correlations: Record<string, Record<string, number>>;
  duplicateRows: number;
}

export interface ColumnStats {
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  median?: number;
  q25?: number;
  q75?: number;
  topValues?: Array<{ value: string; count: number }>;
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export interface AnalysisRequest {
  datasetId: string;
  businessProblem: string;
  analysisTypes: AnalysisType[];
  depth: "quick" | "standard" | "deep";
}

export type AnalysisType =
  | "descriptive"
  | "diagnostic"
  | "predictive"
  | "prescriptive"
  | "anomaly"
  | "clustering"
  | "forecasting";

export interface AnalysisResult {
  id: string;
  datasetId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  currentStep: string;
  insights: Insight[];
  kpis: KPI[];
  charts: ChartData[];
  sqlQueries: SQLQuery[];
  pythonScript: string;
  excelFormulas: ExcelFormula[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  createdAt: string;
  completedAt?: string;
}

export interface Insight {
  id: string;
  severity: "critical" | "warning" | "positive" | "info";
  title: string;
  detail: string;
  supportingData: unknown;
  confidence: number;
  action: string;
}

export interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  isPositive: boolean;
  icon: string;
  description: string;
}

export interface ChartData {
  id: string;
  type: "bar" | "line" | "area" | "pie" | "scatter" | "heatmap" | "radar";
  title: string;
  description: string;
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export interface ChartConfig {
  xKey: string;
  yKeys: string[];
  colors: string[];
  stacked?: boolean;
}

export interface SQLQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  dialect: "postgresql" | "mysql" | "sqlite";
}

export interface ExcelFormula {
  name: string;
  formula: string;
  explanation: string;
  useCase: string;
  category: string;
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
}

export interface Anomaly {
  column: string;
  rowIndex: number;
  value: unknown;
  zScore: number;
  description: string;
  severity: "low" | "medium" | "high";
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  charts?: ChartData[];
  tableData?: Record<string, unknown>[];
}

// ── Report ────────────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  analysisId: string;
  format: "pdf" | "pptx" | "excel" | "json";
  status: "generating" | "ready" | "error";
  downloadUrl?: string;
  createdAt: string;
}

// ── API responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
