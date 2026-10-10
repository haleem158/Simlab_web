"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { renderShareCard } from "@/lib/shareCard";
import { listCharts, type ChartSpec } from "@/lib/shareCharts";
import { RUN_META, type NewRun } from "@/lib/runs";

export function ShareButton({ run }: { run: NewRun | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn ghost" disabled={!run} onClick={() => setOpen(true)}>
        Share
        <Icon n="share" style={{ width: 16, height: 16 }} />
      </button>
      {open && run ? <ShareDialog run={run} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ShareDialog({ run, onClose }: { run: NewRun; onClose: () => void }) {
  const [charts] = useState<ChartSpec[]>(() => listCharts());
  const [pick, setPick] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [host, setHost] = useState("simlab-web.vercel.app");
  const [root, setRoot] = useState<Element | null>(null);

  useEffect(() => {
    setRoot(document.querySelector(".slab"));
    setHost(window.location.host);
  }, []);

  useEffect(() => {
    let dead = false;
    let u: string | null = null;
    setBlob(null);
    renderShareCard(run, host, charts[pick] ?? null)
      .then((b) => {
        if (dead) return;
        u = URL.createObjectURL(b);
        setBlob(b);
        setUrl(u);
      })
      .catch(() => !dead && setNote("Could not draw the image."));
    return () => {
      dead = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [run, host, charts, pick]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const name = `simlab-${run.type}.png`;
  const text = `${run.headline.label}: ${run.headline.parts.pre}${run.headline.parts.to.toLocaleString("en-US", { maximumFractionDigits: run.headline.parts.dec })}${run.headline.parts.suf} (${RUN_META[run.type].name} simulation on Simlab)`;

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };
  const copy = async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setNote("Image copied. Paste it into your post.");
    } catch {
      setNote("Copy isn't supported here. Use Download image.");
    }
  };
  const nativeShare = async () => {
    if (!blob) return;
    const file = new File([blob], name, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
      else setNote("Sharing isn't supported here. Use Download image.");
    } catch {}
  };
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " " + window.location.origin)}`;

  const node = (
    <div className="shov" onClick={onClose}>
      <div className="shdlg" role="dialog" aria-label="Share this result" onClick={(e) => e.stopPropagation()}>
        <div className="shhd">
          <b>Share this result</b>
          <button type="button" className="shx" onClick={onClose} aria-label="Close">
            <Icon n="x" style={{ width: 16, height: 16 }} />
          </button>
        </div>
        {charts.length > 1 ? (
          <div className="shchips" role="tablist" aria-label="Chart on the image">
            {charts.map((c, i) => (
              <button key={c.title} type="button" role="tab" aria-selected={i === pick} className={i === pick ? "on" : ""} onClick={() => setPick(i)}>
                {c.title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="shprev">{url && blob ? <img src={url} alt="Share image preview" /> : <span>Drawing image…</span>}</div>
        <div className="shbtns">
          <button type="button" className="btn lavb" onClick={download} disabled={!blob}>Download image</button>
          <button type="button" className="btn ghost" onClick={copy} disabled={!blob}>Copy image</button>
          <button type="button" className="btn ghost" onClick={nativeShare} disabled={!blob}>Share…</button>
          <a className="btn ghost" href={tweet} target="_blank" rel="noreferrer">Post on X</a>
        </div>
        <p className="shnote">{note || "X can't attach images from a link, so download or copy the image and add it to your post."}</p>
      </div>
    </div>
  );
  return root ? createPortal(node, root) : null;
}
