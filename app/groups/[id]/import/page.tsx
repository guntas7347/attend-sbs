"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { getGroupByIdAction, importStudentsAction } from "@/lib/actions/groups";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Copy,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

interface ParsedStudent {
  name: string;
  rollNumber: string;
  fatherName?: string;
  image?: string;
  isValid: boolean;
  error?: string;
}

const AI_PROMPT_TEMPLATE = `Please convert the following student roster/list into a clean CSV format for my attendance app.

Target CSV format requirements:
- First line must be the exact header: rollNumber,name,fatherName
- "rollNumber": (Required) Student's roll number or ID (e.g. 1, 2, 24, CS-101).
- "name": (Required) Full name of the student.
- "fatherName": (Optional) Father's name if available, otherwise leave blank.

Rules:
1. Extract all students from the text or table provided.
2. Output ONLY the raw CSV text. Do NOT enclose in markdown code fences (no \`\`\`csv) and do NOT include any commentary or explanations.
3. Wrap values with quotes if they contain commas.

Example CSV output:
rollNumber,name,fatherName
1,Aarav Sharma,Rajesh Sharma
2,Diya Patel,Suresh Patel
3,Guntas Singh,Balwinder Singh

Here is the raw student data to format:
[PASTE YOUR RAW STUDENT DATA / LIST / PDF TEXT HERE]`;

export default function ImportStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudent[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Mode: "upload" | "paste"
  const [importMode, setImportMode] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");

  // AI Prompt UI state
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGroupByIdAction(groupId);
        if (res.success && res.group) {
          setGroup(res.group);
          if (!res.group.isOwner) {
            setFileError("Unauthorized: Only the group owner can import students into this group.");
          }
        } else {
          setFileError(res.error || "Group not found");
        }
      } catch {
        setFileError("Failed to load group");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  function normalizeKeys(obj: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const cleanKey = key
        .toLowerCase()
        .replace(/[\s_-]+/g, "")
        .trim();
      normalized[cleanKey] = obj[key];
    }
    return normalized;
  }

  function processRawRows(rawObjects: Record<string, any>[]) {
    if (!group) return;

    const existingRolls = new Set(
      group.students.map((s: any) => String(s.rollNumber).trim())
    );
    const seenInFile = new Set<string>();

    const rows: ParsedStudent[] = [];

    for (let i = 0; i < rawObjects.length; i++) {
      const raw = normalizeKeys(rawObjects[i]);

      // Map columns flexibly
      const name = String(
        raw["name"] || raw["studentname"] || raw["fullname"] || ""
      ).trim();
      const rollNumber = String(
        raw["rollnumber"] || raw["rollno"] || raw["roll"] || raw["id"] || ""
      ).trim();
      const fatherName = String(
        raw["fathername"] || raw["fathersname"] || raw["father"] || ""
      ).trim();
      const image = String(raw["image"] || raw["photo"] || "").trim();

      // Skip empty blank trailing rows
      if (!name && !rollNumber) continue;

      let isValid = true;
      let error = "";

      if (!name) {
        isValid = false;
        error = "Missing student name";
      } else if (!rollNumber) {
        isValid = false;
        error = "Missing roll number";
      } else if (seenInFile.has(rollNumber)) {
        isValid = false;
        error = `Duplicate roll #${rollNumber} in input`;
      } else if (existingRolls.has(rollNumber)) {
        isValid = false;
        error = `Roll #${rollNumber} already exists in group`;
      } else {
        seenInFile.add(rollNumber);
      }

      rows.push({
        name,
        rollNumber,
        fatherName: fatherName || undefined,
        image: image || undefined,
        isValid,
        error,
      });
    }

    if (rows.length === 0) {
      setFileError(
        "No student records found. Ensure headers contain 'rollNumber' and 'name'."
      );
    } else {
      setFileError(null);
      setParsedRows(rows);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedRows([]);
    setFileError(null);

    const isExcel =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.type.includes("sheet") ||
      file.type.includes("excel");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheet = workbook.SheetNames[0];
          const raw = XLSX.utils.sheet_to_json<Record<string, any>>(
            workbook.Sheets[firstSheet],
            { defval: "" }
          );
          processRawRows(raw);
        } catch (err) {
          console.error("Excel parse error:", err);
          setFileError("Failed to parse Excel file. Please verify format.");
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && Array.isArray(results.data)) {
            processRawRows(results.data as Record<string, any>[]);
          } else {
            setFileError("No valid rows in CSV file");
          }
        },
        error: (err: any) => {
          setFileError(`CSV parsing error: ${err.message}`);
        },
      });
    }
  }

  function parsePastedCsv(text: string) {
    const cleanText = text.trim();
    if (!cleanText) {
      setParsedRows([]);
      setFileError(null);
      return;
    }

    // Strip markdown code fences if AI generated ```csv ... ```
    const unquotedText = cleanText
      .replace(/^```(?:csv|tsv)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    Papa.parse(unquotedText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && Array.isArray(results.data)) {
          processRawRows(results.data as Record<string, any>[]);
        } else {
          setFileError("Could not parse pasted CSV data.");
        }
      },
      error: (err: any) => {
        setFileError(`Parse error: ${err.message}`);
      },
    });
  }

  function handlePasteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setPastedText(text);
    parsePastedCsv(text);
  }

  function handleCopyAiPrompt() {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => {
      setCopiedPrompt(false);
    }, 2500);
  }

  async function handleConfirmImport() {
    const validStudents = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({
        name: r.name,
        rollNumber: r.rollNumber,
        fatherName: r.fatherName,
        image: r.image,
      }));

    if (validStudents.length === 0) {
      setFileError("No valid students to import.");
      return;
    }

    setImporting(true);
    setFileError(null);

    try {
      const res = await importStudentsAction(groupId, validStudents);
      if (res.success) {
        router.push(`/groups/${groupId}`);
        router.refresh();
      } else {
        setFileError(res.error || "Failed to import students");
      }
    } catch {
      setFileError("An unexpected network error occurred");
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader
        title="Import Students"
        subtitle={group?.name}
        backHref={`/groups/${groupId}`}
      />

      <div className="flex-1 p-4 space-y-4 pb-28">
        {/* AI Prompt Assistant Banner / Card */}
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shrink-0 shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  AI Formatting Prompt
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Have an unformatted student list or image? Ask AI to generate the CSV.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyAiPrompt}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                copiedPrompt
                  ? "bg-success text-success-foreground"
                  : "bg-accent text-accent-foreground hover:opacity-95 active:scale-95"
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy AI Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPromptDetails(!showPromptDetails)}
              className="text-[11px] font-semibold text-accent flex items-center gap-1 hover:underline"
            >
              <span>{showPromptDetails ? "Hide prompt details" : "View prompt text"}</span>
              {showPromptDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showPromptDetails && (
              <div className="mt-2 rounded-xl bg-surface border border-border p-3 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {AI_PROMPT_TEMPLATE}
              </div>
            )}
          </div>
        </div>

        {/* Input Mode Selector (Upload File vs Paste CSV) */}
        <div className="grid grid-cols-2 rounded-xl bg-secondary p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setImportMode("upload");
              setFileError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              importMode === "upload"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportMode("paste");
              setFileError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              importMode === "paste"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            <span>Paste CSV Text</span>
          </button>
        </div>

        {/* Format Guidance Card */}
        <div className="rounded-2xl border border-border bg-surface p-3.5 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-foreground text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
            <span>Expected Columns</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            Required: <span className="font-mono text-foreground font-semibold">rollNumber</span>, <span className="font-mono text-foreground font-semibold">name</span>.
            &nbsp;•&nbsp;
            Optional: <span className="font-mono text-foreground">fatherName</span>.
          </p>
        </div>

        {fileError && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3.5 text-xs font-medium text-danger flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}

        {/* ================= UPLOAD MODE ================= */}
        {importMode === "upload" && (
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-6 text-center">
            <input
              id="file-upload"
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-accent">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">
                  {fileName ? fileName : "Choose CSV or Excel file"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap here to browse your files (.csv, .xlsx, .xls)
                </p>
              </div>
            </label>
          </div>
        )}

        {/* ================= PASTE MODE ================= */}
        {importMode === "paste" && (
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Paste CSV or TSV data:
              </span>
              {pastedText && (
                <button
                  type="button"
                  onClick={() => {
                    setPastedText("");
                    setParsedRows([]);
                    setFileError(null);
                  }}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-danger flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <textarea
              rows={6}
              value={pastedText}
              onChange={handlePasteChange}
              placeholder={`rollNumber,name,fatherName\n1,Aarav Sharma,Rajesh Sharma\n2,Diya Patel,Suresh Patel\n3,Guntas Singh,Balwinder Singh`}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
            />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Paste comma or tab-separated student data directly.</span>
              <button
                type="button"
                onClick={() => parsePastedCsv(pastedText)}
                className="px-3 py-1.5 rounded-lg bg-secondary font-bold text-foreground hover:bg-muted active:scale-95 transition-all text-xs"
              >
                Re-Parse Data
              </button>
            </div>
          </div>
        )}

        {/* Validation Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-foreground">Preview ({parsedRows.length})</span>
                <span className="text-success bg-success/15 px-2 py-0.5 rounded-md">
                  {validCount} Ready
                </span>
                {invalidCount > 0 && (
                  <span className="text-danger bg-danger/15 px-2 py-0.5 rounded-md">
                    {invalidCount} Errors
                  </span>
                )}
              </div>

              {/* Top Quick Import Button */}
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || validCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 shadow-xs"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Import ({validCount})</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {parsedRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                    row.isValid
                      ? "border-border bg-surface"
                      : "border-danger/30 bg-danger/5"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent bg-secondary px-1.5 py-0.5 rounded">
                        #{row.rollNumber || "?"}
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {row.name || "Missing Name"}
                      </span>
                    </div>
                    {row.fatherName && (
                      <p className="text-muted-foreground text-[11px]">
                        S/o {row.fatherName}
                      </p>
                    )}
                    {!row.isValid && (
                      <p className="text-danger text-[11px] font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {row.error}
                      </p>
                    )}
                  </div>

                  <div>
                    {row.isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-danger" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Bottom Import Button */}
            <div className="pt-3 pb-8">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || validCount === 0}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
              >
                {importing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Confirm & Import {validCount} Students</span>
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
