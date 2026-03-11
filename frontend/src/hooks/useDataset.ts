import { useState, useCallback } from "react";
import { datasetApi } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { Dataset, DataProfile } from "@/types";

export function useDataset() {
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const { addDataset, setActiveDataset } = useAppStore();

  const upload = useCallback(async (file: File): Promise<Dataset | null> => {
    setUploading(true);
    setError(null);
    setUploadPct(0);

    // Validate file
    const allowed = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (!allowed.includes(file.type)) {
      setError("Only CSV and Excel files are allowed.");
      setUploading(false);
      return null;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit.");
      setUploading(false);
      return null;
    }

    try {
      const { data } = await datasetApi.upload(file, setUploadPct);
      const dataset: Dataset = data.data;
      addDataset(dataset);
      setActiveDataset(dataset);
      setUploading(false);
      return dataset;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      setError(msg);
      setUploading(false);
      return null;
    }
  }, [addDataset, setActiveDataset]);

  const getProfile = useCallback(async (id: string): Promise<DataProfile | null> => {
    try {
      const { data } = await datasetApi.profile(id);
      return data.data as DataProfile;
    } catch {
      return null;
    }
  }, []);

  const getPreview = useCallback(async (id: string, rows = 50) => {
    try {
      const { data } = await datasetApi.preview(id, rows);
      return data.data;
    } catch {
      return null;
    }
  }, []);

  return { upload, getProfile, getPreview, uploading, uploadPct, error };
}
