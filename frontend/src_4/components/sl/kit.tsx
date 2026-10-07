"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
  useController,
} from "react-hook-form";
import { CountUp } from "./CountUp";
import { Icon } from "./Icon";
import type { KpiParts } from "@/lib/charts";

/* ---------- number inputs ---------- */

const raw = (v: number) => String(+v.toFixed(6));
const grouped = (v: number) =>
  Number.isInteger(v) && Math.abs(v) >= 1000
    ? v.toLocaleString("en-US")
    : String(+v.toFixed(6));
const isBlank = (v: unknown) =>
  v === "" ||
  v === null ||
  v === undefined ||
  (typeof v === "number" && Number.isNaN(v));

function useNum<T extends FieldValues>(
  control: Control<T>,
  name: Path<T>,
  rules: RegisterOptions<T, Path<T>> | undefined,
  scale = 1,
  suffix = "",
  prefix = "",
) {
  const { field, fieldState } = useController({
    control,
    name,
    rules: rules as never,
  });
  const [focus, setFocus] = useState(false);
  const [text, setText] = useState("");
  const v = field.value as unknown;
  const shown = focus
    ? text
    : isBlank(v)
      ? ""
      : prefix + grouped(Math.round(Number(v) * scale * 1e6) / 1e6) + suffix;
  return {
    invalid: fieldState.invalid,
    inputProps: {
      ref: field.ref,
      name: field.name,
      value: shown,
      inputMode: "decimal" as const,
      autoComplete: "off",
      onFocus: () => {
        setText(isBlank(v) ? "" : raw(Number(v) * scale));
        setFocus(true);
      },
      onBlur: () => {
        setFocus(false);
        field.onBlur();
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value;
        setText(t);
        const c = t.replace(/[,$%\s]/g, "");
        if (c === "" || c === "-" || c === ".") return field.onChange("");
        const n = Number(c);
        if (!Number.isNaN(n)) field.onChange(n / scale);
      },
    },
  };
}

type NumProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
  scale?: number;
  suffix?: string;
  prefix?: string;
};

export function NumField<T extends FieldValues>(
  p: NumProps<T> & {
    label: string;
    unit?: string;
    hint?: string;
    disabled?: boolean;
  },
) {
  const { inputProps, invalid } = useNum(
    p.control,
    p.name,
    p.rules,
    p.scale,
    p.suffix,
    p.prefix,
  );
  const id = `f-${p.name}`;
  return (
    <div className="fld">
      <label htmlFor={id}>{p.label}</label>
      <div className={`inp${invalid ? " bad" : ""}`}>
        <input id={id} {...inputProps} disabled={p.disabled} />
        <span>{p.unit}</span>
      </div>
      {p.hint ? <div className="hint">{p.hint}</div> : null}
    </div>
  );
}

export function NumCell<T extends FieldValues>(
  p: NumProps<T> & { label: string },
) {
  const { inputProps, invalid } = useNum(
    p.control,
    p.name,
    p.rules,
    p.scale,
    p.suffix,
    p.prefix,
  );
  return (
    <div className={`ce${invalid ? " bad" : ""}`}>
      <input aria-label={p.label} {...inputProps} />
    </div>
  );
}

export function TextCell<T extends FieldValues>(p: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  const { field } = useController({ control: p.control, name: p.name });
  return (
    <input
      className="tin"
      aria-label={p.label}
      value={(field.value as string) ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
    />
  );
}

/* ---------- sliders ---------- */

export function Range({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const f = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const fs = f.toFixed(2);
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <div className="rng">
        <div className="rt2">
          <div className="rf" style={{ width: `${fs}%` }} />
          <div className="rh" style={{ left: `${fs}%` }} />
          <input
            id={id}
            className="rin"
            type="range"
            min={min}
            max={max}
            step={step}
            value={Math.min(max, Math.max(min, value))}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <b>{display}</b>
      </div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

/** Slider over a value stored as a fraction (0.05 = 5%). */
export function PctRange<T extends FieldValues>(p: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minPct: number;
  maxPct: number;
  stepPct?: number;
  digits?: number;
  hint?: string;
}) {
  const { field } = useController({ control: p.control, name: p.name });
  const pct = (isBlank(field.value) ? 0 : Number(field.value)) * 100;
  return (
    <Range
      id={`f-${p.name}`}
      label={p.label}
      value={pct}
      min={p.minPct}
      max={p.maxPct}
      step={p.stepPct ?? 0.1}
      display={`${pct.toFixed(p.digits ?? 1)}%`}
      hint={p.hint}
      onChange={(v) => field.onChange(Math.round(v * 1e4) / 1e6)}
    />
  );
}

export function PlainRange<T extends FieldValues>(p: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  min: number;
  max: number;
  step: number;
  digits?: number;
  hint?: string;
}) {
  const { field } = useController({ control: p.control, name: p.name });
  const v = isBlank(field.value) ? p.min : Number(field.value);
  return (
    <Range
      id={`f-${p.name}`}
      label={p.label}
      value={v}
      min={p.min}
      max={p.max}
      step={p.step}
      display={v.toFixed(p.digits ?? 2)}
      hint={p.hint}
      onChange={field.onChange}
    />
  );
}

/* ---------- small controls ---------- */

export function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="tgr">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`tgl${on ? "" : " off"}`}
        onClick={() => onChange(!on)}
      />
    </div>
  );
}

export function Chips({
  items,
  active,
  onPick,
}: {
  items: { id: string; label: string }[];
  active: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="chips">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`chp${active === it.id ? " on" : ""}`}
          onClick={() => onPick(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Seg({
  items,
  active,
  onPick,
}: {
  items: { id: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="seg3" role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={active === it.id}
          className={active === it.id ? "on" : ""}
          onClick={() => onPick(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Group({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grp">
      <h4>
        <i style={{ background: color }} />
        {title}
      </h4>
      {children}
    </div>
  );
}

/* ---------- results ---------- */

export function Kpi({
  label,
  parts,
  delta,
  tone,
  runKey,
}: {
  label: string;
  parts: KpiParts;
  delta: string;
  tone?: "g" | "r";
  runKey: number;
}) {
  return (
    <div className="kp">
      <div className="h">{label}</div>
      <div className="v">
        <CountUp
          key={runKey}
          to={parts.to}
          dec={parts.dec}
          pre={parts.pre}
          suf={parts.suf}
        />
      </div>
      <div className={`d ${tone ?? ""}`}>{delta}</div>
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { color: string; text: string }[];
}) {
  return (
    <div className="lg">
      {items.map((i) => (
        <span key={i.text}>
          <i style={{ background: i.color }} />
          {i.text}
        </span>
      ))}
    </div>
  );
}

export function ChartPanel({
  title,
  sub,
  legend,
  children,
  className,
}: {
  title: string;
  sub: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`panel ${className ?? "cp"}`}
      style={className ? { margin: 0 } : undefined}
    >
      <div className="cph">
        <div>
          <h3>{title}</h3>
          <div className="sub">{sub}</div>
        </div>
        {legend}
      </div>
      {children}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pgh">
      <div>
        <div className="rec">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <div className="rr">{children}</div>
    </div>
  );
}

export function ErrorBox({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="errb" role="alert">
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onClose}>
        <Icon
          n="plus"
          style={{ transform: "rotate(45deg)", width: 16, height: 16 }}
        />
      </button>
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel empty">
      <Icon n="flask" style={{ width: 28, height: 28, color: "#52525b" }} />
      <div className="t">{title}</div>
      <div className="s">{text}</div>
    </div>
  );
}
