"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TicketTypeItem } from "./attendee-ledger-table";

interface AttendeeCsvImportModalProps {
  eventId: string;
  tickets: TicketTypeItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function AttendeeCsvImportModal({
  eventId,
  tickets,
  isOpen,
  onClose,
}: AttendeeCsvImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"file" | "paste">("file");
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    importedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try pasting the content directly.");
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      "First Name,Last Name,Email,Phone,Church,Ticket Package,Gender,Table Number,Seat Number",
      "Emmanuel,Adeyemi,emmanuel.adeyemi@example.com,+2348012345678,Grace Tabernacle,General Admission,Male,Table 1,Seat 4",
      "Grace,Okonkwo,grace.okonkwo@example.com,+2348098765432,Faith Assembly,VIP,Female,Table 2,Seat 1",
    ].join("\n");

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "selah-attendees-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError("Please select a CSV file or paste spreadsheet text.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/events/${eventId}/import-registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          defaultTicketTypeId: selectedTicketId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to import attendees. Please verify CSV formatting.");
      } else {
        setResult({
          importedCount: data.importedCount,
          skippedCount: data.skippedCount,
          errors: data.errors || [],
        });
        router.refresh();
      }
    } catch {
      setError("Network error while importing attendees. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewLines = csvContent
    .trim()
    .split("\n")
    .slice(0, 5)
    .map((line) => line.split(",").map((s) => s.trim().replace(/^"|"$/g, "")));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#13110F] text-[#FAF8F5] shadow-2xl p-6 sm:p-8 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(192,138,46,0.15)] text-[var(--color-brass)] border border-[rgba(192,138,46,0.3)]">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                Bulk Attendee CSV Import
              </h2>
              <p className="text-xs text-warm-400 mt-0.5">
                Upload church member rosters, choir lists, or delegates to auto-issue QR badges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-warm-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Banner */}
        {result ? (
          <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-white text-base">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs mt-1 text-emerald-200">
                  <strong className="text-white font-bold">{result.importedCount}</strong> attendees have been registered and issued QR entrance passes.
                  {result.skippedCount > 0 && ` (${result.skippedCount} rows skipped)`}
                </p>

                {result.errors.length > 0 && (
                  <div className="mt-3 rounded-lg bg-black/30 p-2.5 text-[0.7rem] font-mono text-warm-400">
                    <p className="font-semibold text-warm-300 mb-1">Warnings / Skipped Details:</p>
                    {result.errors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                    className="btn btn-primary !py-2 !px-4 !text-xs"
                  >
                    Done &amp; View Attendees
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setCsvContent("");
                      setFileName("");
                    }}
                    className="btn btn-ghost !py-2 !px-4 !text-xs"
                  >
                    Import Another File
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 my-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Selector & Download Sample */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("file")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === "file" ? "bg-brass text-black" : "text-warm-400 hover:text-white"
                  }`}
                >
                  <Upload size={13} /> Upload File (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === "paste" ? "bg-brass text-black" : "text-warm-400 hover:text-white"
                  }`}
                >
                  <ClipboardList size={13} /> Paste Spreadsheet Data
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brass)] hover:underline cursor-pointer"
              >
                <Download size={13} /> Download Sample CSV Template
              </button>
            </div>

            {/* Input View */}
            {mode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 hover:border-brass/50 bg-black/20 p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-warm-300 mb-3">
                  <Upload size={22} />
                </div>
                {fileName ? (
                  <div>
                    <span className="font-semibold text-brass text-sm">{fileName}</span>
                    <p className="text-xs text-warm-400 mt-1">
                      File loaded ({csvContent.split("\n").filter(Boolean).length - 1} data rows detected)
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-white">
                      Click to choose or drag &amp; drop CSV file
                    </span>
                    <p className="text-xs text-warm-400 mt-1">
                      Columns: First Name, Last Name, Email, Phone, Church, Ticket Package
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-warm-300 mb-1.5">
                  Paste rows directly from Microsoft Excel or Google Sheets (CSV format):
                </label>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="First Name,Last Name,Email,Phone,Church&#10;David,Oyedepo,david@example.com,+2348012345678,Winners Chapel&#10;Foluke,Adeboye,foluke@example.com,+2348099887766,RCCG"
                  className="input !font-mono !text-xs !bg-black/50 !w-full"
                />
              </div>
            )}

            {/* Default Ticket Type Assignment */}
            {tickets.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <label className="block text-xs font-semibold text-warm-300 mb-1">
                  Default Ticket Package (Optional):
                </label>
                <p className="text-[0.7rem] text-warm-500 mb-2">
                  Attendees whose row does not specify a &quot;Ticket Package&quot; column will be assigned to this tier.
                </p>
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="input !text-xs !py-2 !bg-[#1c1917] !w-full text-white"
                >
                  <option value="">General Admission (Standard Pass)</option>
                  {tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.price > 0 ? `(${t.price})` : "(Free)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CSV Data Preview */}
            {previewLines.length > 1 && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-warm-300">
                    Live Data Preview (First {Math.min(4, previewLines.length - 1)} rows):
                  </span>
                  <span className="text-[0.6875rem] text-brass">
                    Total: {csvContent.split("\n").filter(Boolean).length - 1} records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[0.725rem] text-warm-300">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-semibold">
                        {previewLines[0].slice(0, 5).map((col, idx) => (
                          <th key={idx} className="pb-1.5 pr-3">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewLines.slice(1, 5).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.slice(0, 5).map((cell, cIdx) => (
                            <td key={cIdx} className="py-1.5 pr-3 truncate max-w-[120px]">{cell || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-ghost !py-2 !px-4 !text-xs cursor-pointer text-warm-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={submitting || !csvContent.trim()}
                className="btn btn-primary !py-2 !px-5 !text-xs cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing &amp; Generating Badges...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Import {csvContent.split("\n").filter(Boolean).length > 1 ? `${csvContent.split("\n").filter(Boolean).length - 1} Attendees` : "Attendees"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
