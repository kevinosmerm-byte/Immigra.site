import { STORY_LIMITS } from "./storyPractice.js";

export async function readStoryFile(file, { signal, onProgress = () => {} } = {}) {
  const check = () => signal?.throwIfAborted();
  check();
  if (!file || file.size > STORY_LIMITS.bytes) throw new Error("FILE_TOO_LARGE");
  const pdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
  if (!pdf && !/\.txt$/i.test(file.name) && file.type !== "text/plain") throw new Error("FILE_TYPE");
  let text;
  if (!pdf) {
    text = await file.text(); check();
  } else {
    const [{ GlobalWorkerOptions, getDocument }, worker] = await Promise.all([
      import("../modules/citizenship/node_modules/pdfjs-dist/build/pdf.mjs"), import("../modules/citizenship/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    check();
    GlobalWorkerOptions.workerSrc = worker.default;
    const bytes = new Uint8Array(await file.arrayBuffer()); check();
    const task = getDocument({ data: bytes, isEvalSupported: false });
    const abort = () => { task.destroy().catch(() => {}); };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const document = await task.promise; check();
      if (document.numPages > STORY_LIMITS.pages) throw new Error("TOO_MANY_PAGES");
      const pages = [];
      for (let number = 1; number <= document.numPages; number++) {
        check();
        const page = await document.getPage(number);
        const content = await page.getTextContent(); check();
        const value = content.items.map(item => `${item.str || ""}${item.hasEOL ? "\n" : " "}`).join("").trim();
        if (value.length < 10) throw new Error("OCR_UNAVAILABLE");
        pages.push(value); page.cleanup();
        if (pages.reduce((total, item) => total + item.length, 0) > STORY_LIMITS.characters) throw new Error("STORY_TOO_LONG");
        onProgress(number, document.numPages);
      }
      text = pages.join("\n\n");
    } finally {
      signal?.removeEventListener("abort", abort);
      await task.destroy();
    }
  }
  check();
  text = text.replace(/^\uFEFF/, "").trim();
  if (text.length < 30) throw new Error("STORY_TEXT_REQUIRED");
  if (text.length > STORY_LIMITS.characters) throw new Error("STORY_TOO_LONG");
  return text;
}
