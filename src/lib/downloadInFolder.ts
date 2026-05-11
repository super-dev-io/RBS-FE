/*
 * Save resume (and optional cover letter) into a company-named folder on the
 * user's machine. On Chromium browsers with the File System Access API, we
 * prompt for a parent directory once and write `{Company}/{Full Name}.pdf`
 * directly. On Firefox/Safari we fall back to plain anchor downloads with the
 * candidate's full name as filename (no folder).
 */

const INVALID_FS_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;

function sanitizeName(name: string, fallback: string): string {
  const cleaned = name.replace(INVALID_FS_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return cleaned || fallback;
}

function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && typeof (window as any).showDirectoryPicker === "function";
}

async function writeBlobToHandle(
  dir: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(blob);
  await writable.close();
}

function fallbackAnchorDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface DownloadIntoCompanyFolderArgs {
  companyName: string;
  fullName: string;
  resumeBlob: Blob;
  coverLetterBlob?: Blob | null;
}

export interface DownloadResult {
  mode: "directory" | "fallback";
  /** Files written, in display form (relative to picked parent for "directory", just filename for "fallback"). */
  files: string[];
}

export async function downloadIntoCompanyFolder(
  args: DownloadIntoCompanyFolderArgs
): Promise<DownloadResult> {
  const company = sanitizeName(args.companyName, "Company");
  const person = sanitizeName(args.fullName, "Resume");
  const resumeFile = `${person}.pdf`;
  const coverFile = `${person} - Cover Letter.pdf`;

  if (supportsDirectoryPicker()) {
    let parent: FileSystemDirectoryHandle;
    try {
      parent = await (window as any).showDirectoryPicker({ mode: "readwrite" });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return { mode: "directory", files: [] };
      }
      throw err;
    }
    const dir = await parent.getDirectoryHandle(company, { create: true });
    const written: string[] = [];
    await writeBlobToHandle(dir, resumeFile, args.resumeBlob);
    written.push(`${company}/${resumeFile}`);
    if (args.coverLetterBlob) {
      await writeBlobToHandle(dir, coverFile, args.coverLetterBlob);
      written.push(`${company}/${coverFile}`);
    }
    return { mode: "directory", files: written };
  }

  // Fallback: plain downloads, no folder
  fallbackAnchorDownload(args.resumeBlob, resumeFile);
  const written: string[] = [resumeFile];
  if (args.coverLetterBlob) {
    fallbackAnchorDownload(args.coverLetterBlob, coverFile);
    written.push(coverFile);
  }
  return { mode: "fallback", files: written };
}

export function supportsCompanyFolderDownload(): boolean {
  return supportsDirectoryPicker();
}
