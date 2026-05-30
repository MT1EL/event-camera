type SavePhoto = { url: string; name: string };

export type SaveResult = "shared" | "downloaded" | "cancelled";

/** Triggers a browser download for a single file (the desktop "Save As" path). */
function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later so the download isn't cancelled before it starts.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Saves images to the device. On iOS/Android the native share sheet is the only
 * route to the camera roll, so files are handed to it; everywhere else each file
 * downloads directly ("Save As"). Throws if any image can't be fetched (e.g. CORS).
 */
export async function savePhotosToDevice(
  photos: SavePhoto[],
  shareTitle: string,
): Promise<SaveResult> {
  const files = await Promise.all(
    photos.map(async (p) => {
      const res = await fetch(p.url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const type = blob.type || "image/jpeg";
      const ext = type.includes("png") ? "png" : "jpg";
      const name = p.name.endsWith(`.${ext}`) ? p.name : `${p.name}.${ext}`;
      return new File([blob], name, { type });
    }),
  );

  const ua = navigator.userAgent;
  const isMobile =
    /Android|iPhone|iPod|iPad/i.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);

  const canShareFiles =
    isMobile &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files });

  if (canShareFiles) {
    try {
      await navigator.share({ files, title: shareTitle });
      return "shared";
    } catch {
      return "cancelled"; // user dismissed the share sheet
    }
  }

  for (const file of files) {
    downloadFile(file);
    await new Promise((r) => window.setTimeout(r, 200));
  }
  return "downloaded";
}
