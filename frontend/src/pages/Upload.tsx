import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, FileAudio, Clock, Hash, Save } from "lucide-react";
import { FILES } from "../api/client";
import type { AudioFile } from "../types";

function fmtDuration(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function fmtSize(b: number) {
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [gts, setGts] = useState<Record<number, string>>({});
  const qc = useQueryClient();

  const { data: files = [], isLoading } = useQuery<AudioFile[]>({
    queryKey: ["files"],
    queryFn: FILES.list,
    refetchInterval: 8_000,
  });

  const uploadMut = useMutation({
    mutationFn: FILES.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });

  const deleteMut = useMutation({
    mutationFn: FILES.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });

  const gtMut = useMutation({
    mutationFn: ({ id, gt }: { id: number; gt: string }) =>
      FILES.updateGroundTruth(id, gt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });

  const processFiles = useCallback(
    (raw: FileList | null) => {
      if (!raw) return;
      const wavs = Array.from(raw).filter((f) => f.name.toLowerCase().endsWith(".wav"));
      if (!wavs.length) return alert("Only .WAV files are accepted.");
      const fd = new FormData();
      wavs.forEach((f) => fd.append("files", f));
      uploadMut.mutate(fd);
    },
    [uploadMut]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Audio Files</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload WAV files and optionally set ground-truth transcripts.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-950/20" : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <Upload className="w-10 h-10 text-gray-500" />
        <p className="text-gray-400 text-sm">Drag & drop WAV files, or</p>
        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer text-sm font-medium transition-colors">
          Browse Files
          <input
            type="file"
            accept=".wav"
            multiple
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </label>
        <p className="text-xs text-gray-600">Supports multiple files at once</p>
      </div>

      {uploadMut.isPending && (
        <p className="text-sm text-indigo-400 animate-pulse">Uploading...</p>
      )}

      {/* File list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">
          Files{" "}
          <span className="text-sm font-normal text-gray-400">({files.length})</span>
        </h2>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

        {files.map((file) => {
          const currentGt = gts[file.id] ?? file.ground_truth ?? "";
          return (
            <div key={file.id} className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileAudio className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.original_name}</p>
                    <div className="flex gap-4 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmtDuration(file.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {file.sample_rate ? `${(file.sample_rate / 1000).toFixed(1)}kHz` : "—"}
                      </span>
                      <span>{fmtSize(file.file_size_bytes)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMut.mutate(file.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ground Truth Transcript</label>
                <div className="flex gap-2">
                  <textarea
                    value={currentGt}
                    onChange={(e) => setGts((p) => ({ ...p, [file.id]: e.target.value }))}
                    placeholder="Enter the correct transcript..."
                    className="flex-1 bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none h-16"
                  />
                  <button
                    onClick={() => gtMut.mutate({ id: file.id, gt: currentGt })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-medium transition-colors self-start mt-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                </div>
                {file.ground_truth && (
                  <p className="text-xs text-green-500 mt-1">Ground truth saved</p>
                )}
              </div>
            </div>
          );
        })}

        {!isLoading && files.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No files uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
