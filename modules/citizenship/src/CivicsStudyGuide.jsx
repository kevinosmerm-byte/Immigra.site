import { useEffect, useMemo, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

const STUDY_GUIDE_URL = "/study-guides/uscis-2025-civics-test-study-guide.pdf";

function useBookSpread() {
  const [isSpread, setIsSpread] = useState(() => window.matchMedia("(min-width: 900px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const update = () => setIsSpread(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isSpread;
}

function StudyGuidePage({ document, pageNumber, zoom, label }) {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    if (!document || !pageNumber) return undefined;
    let active = true;
    let renderTask;

    const renderPage = async () => {
      setRendering(true);
      const page = await document.getPage(pageNumber);
      if (!active) return;
      const viewport = page.getViewport({ scale: 1.2 * zoom });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const context = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      });
      await renderTask.promise;
      if (active) setRendering(false);
    };

    renderPage().catch((error) => {
      if (active && error?.name !== "RenderingCancelledException") setRendering(false);
    });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, zoom]);

  return (
    <figure className={`study-guide-page ${rendering ? "is-rendering" : ""}`} aria-label={label} aria-busy={rendering}>
      <canvas ref={canvasRef}></canvas>
      {rendering && <span className="study-guide-page-loader">Loading page {pageNumber}…</span>}
      <figcaption>{pageNumber}</figcaption>
    </figure>
  );
}

export function CivicsStudyGuide({ language = "en", onBack }) {
  const isSpanish = language === "es";
  const isSpread = useBookSpread();
  const [document, setDocument] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const touchStartRef = useRef(null);

  useEffect(() => {
    let active = true;
    const task = getDocument({ url: STUDY_GUIDE_URL });
    task.promise.then((loadedDocument) => {
      if (!active) return;
      setDocument(loadedDocument);
      setPageCount(loadedDocument.numPages);
      setStatus("ready");
    }).catch((error) => {
      if (active) {
        setLoadError(error?.message || "Unknown PDF loading error");
        setStatus("error");
      }
    });
    return () => {
      active = false;
      task.destroy();
    };
  }, []);

  const visiblePages = useMemo(() => {
    if (!pageCount) return [];
    if (!isSpread || page === 1) return [page];
    return [page, page + 1].filter((number) => number <= pageCount);
  }, [isSpread, page, pageCount]);

  const goToPage = (requestedPage) => {
    if (!pageCount) return;
    setPage(Math.min(pageCount, Math.max(1, requestedPage)));
  };

  const previousPage = () => goToPage(page === 2 || !isSpread ? page - 1 : page - 2);
  const nextPage = () => goToPage(isSpread && page > 1 ? page + 2 : page + 1);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") previousPage();
    if (event.key === "ArrowRight") nextPage();
    if (event.key === "Home") goToPage(1);
    if (event.key === "End") goToPage(pageCount);
  };

  const copy = isSpanish ? {
    back: "← 128 Preguntas", eyebrow: "MATERIAL OFICIAL DE USCIS", title: "Guía de estudio 2025",
    subtitle: "128 preguntas y respuestas de civismo · USCIS", previous: "Página anterior", next: "Página siguiente",
    page: "Página", of: "de", zoomOut: "Reducir", zoomIn: "Ampliar", open: "Abrir PDF original",
    loading: "Preparando la guía oficial…", error: "No se pudo cargar la guía. Puedes abrir el PDF original.",
  } : {
    back: "← 128 Questions", eyebrow: "OFFICIAL USCIS MATERIAL", title: "2025 Study Guide",
    subtitle: "128 Civics Questions and Answers · USCIS", previous: "Previous page", next: "Next page",
    page: "Page", of: "of", zoomOut: "Zoom out", zoomIn: "Zoom in", open: "Open original PDF",
    loading: "Preparing the official guide…", error: "The guide could not be loaded. You can open the original PDF.",
  };

  return (
    <div className="practice-screen study-guide-screen" onKeyDown={handleKeyDown} tabIndex="-1">
      <header className="practice-header">
        <button className="back-button" onClick={onBack}>{copy.back}</button>
        
      </header>

      <main className="study-guide-main">
        <section className="study-guide-heading">
          <div>
            <span>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <a href={STUDY_GUIDE_URL} target="_blank" rel="noreferrer">{copy.open}</a>
        </section>

        <section
          className="study-guide-reader"
          aria-label={copy.title}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartRef.current;
            const touch = event.changedTouches[0];
            touchStartRef.current = null;
            if (!start || !touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
              if (dx < 0) nextPage(); else previousPage();
            }
          }}
        >
          <div className="study-guide-toolbar">
            <button type="button" onClick={previousPage} disabled={page <= 1} aria-label={copy.previous}>←</button>
            <label>
              <span>{copy.page}</span>
              <input type="range" min="1" max={pageCount || 1} value={page} onChange={(event) => goToPage(Number(event.target.value))} />
              <strong>{page} {copy.of} {pageCount || "—"}</strong>
            </label>
            <div className="study-guide-zoom">
              <button type="button" onClick={() => setZoom((value) => Math.max(.75, value - .25))} disabled={zoom <= .75} aria-label={copy.zoomOut}>−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + .25))} disabled={zoom >= 1.5} aria-label={copy.zoomIn}>+</button>
            </div>
            <button type="button" onClick={nextPage} disabled={!pageCount || page >= pageCount} aria-label={copy.next}>→</button>
          </div>

          {status === "loading" && <div className="study-guide-status" role="status"><span></span>{copy.loading}</div>}
          {status === "error" && <div className="study-guide-status error" role="alert">{copy.error}<small>{loadError}</small></div>}
          {status === "ready" && (
            <div className={`study-guide-book ${visiblePages.length === 1 ? "single-page" : "two-page"}`}>
              {visiblePages.map((pageNumber) => (
                <StudyGuidePage key={pageNumber} document={document} pageNumber={pageNumber} zoom={zoom} label={`${copy.page} ${pageNumber}`} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
