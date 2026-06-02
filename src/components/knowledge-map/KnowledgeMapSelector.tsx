"use client";

import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  useRef,
  useEffect,
  memo,
} from "react";
import { Search, X, ChevronDown, Save, List } from "lucide-react";
import type { CourseObjective, KnowledgeUnit, KnowledgePoint } from "./data";
import {
  mockData,
  coursesByAbility,
  objectivesByCourse,
  unitsByObjective,
  pointsByUnit,
  pointsById,
} from "./data";

// ─── AIBadge ─────────────────────────────────────────────────────────────────

const AIBadge = memo(function AIBadge() {
  return (
    <span
      className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-white text-[9px] font-bold"
      style={{
        background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
      }}
    >
      AI
    </span>
  );
});

// ─── Checkbox (supports indeterminate / half-select) ──────────────────────────

const Checkbox = memo(function Checkbox({
  checked,
  indeterminate = false,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 shrink-0 cursor-pointer rounded"
      style={{ accentColor: "#6366f1" }}
    />
  );
});

// ─── SearchBar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="px-3 py-2 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm bg-transparent outline-none flex-1 text-gray-700 placeholder:text-gray-400 min-w-0"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── VirtualList (renders only the visible window for large datasets) ─────────

function VirtualList<T extends { id: string }>({
  items,
  itemHeight = 44,
  renderItem,
  empty = "暂无数据",
}: {
  items: T[];
  itemHeight?: number;
  renderItem: (item: T) => React.ReactNode;
  empty?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [boxHeight, setBoxHeight] = useState(300);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setBoxHeight(el.clientHeight);
    const obs = new ResizeObserver(([e]) => setBoxHeight(e.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset scroll when item list changes (e.g. different course/search)
  useEffect(() => {
    if (rootRef.current) rootRef.current.scrollTop = 0;
  }, [items]);

  if (items.length === 0) {
    return (
      <div ref={rootRef} className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">{empty}</p>
      </div>
    );
  }

  const BUF = 5;
  const total = items.length * itemHeight;
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - BUF);
  const end = Math.min(
    items.length,
    Math.ceil((scrollTop + boxHeight) / itemHeight) + BUF,
  );

  return (
    <div
      ref={rootRef}
      className="flex-1 overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: total, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: start * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(start, end).map((item) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PanelHeader ─────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  checked,
  indeterminate,
  onSelectAll,
}: {
  title: string;
  checked: boolean;
  indeterminate: boolean;
  onSelectAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">全选</span>
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={onSelectAll}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KnowledgeMapSelector() {
  // ── Initial navigation anchors ─────────────────────────────────────────────
  const defaultAbilityId = mockData.abilityGroups[0].abilities[0].id;
  const defaultCourseId =
    coursesByAbility.get(defaultAbilityId)?.[0]?.id ?? null;
  const defaultActiveObjId = defaultCourseId
    ? (objectivesByCourse.get(defaultCourseId)?.[0]?.id ?? null)
    : null;
  const defaultActiveUnitId = defaultActiveObjId
    ? (unitsByObjective.get(defaultActiveObjId)?.[0]?.id ?? null)
    : null;

  // ── Navigation state ───────────────────────────────────────────────────────
  const [abilityId, setAbilityId] = useState(defaultAbilityId);
  const [courseId, setCourseId] = useState<string | null>(defaultCourseId);

  // ── Display/navigation state ───────────────────────────────────────────────
  // activeObjId  — whose units appear in col 3
  // activeUnitId — whose points appear in col 4
  const [activeObjId, setActiveObjId] = useState<string | null>(
    defaultActiveObjId,
  );
  const [activeUnitId, setActiveUnitId] = useState<string | null>(
    defaultActiveUnitId,
  );

  // ── Selection state — canonical truth, everything else derived ─────────────
  const [selectedPointIds, setSelectedPointIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [isPending, startTransition] = useTransition();

  // ── Search / filter ────────────────────────────────────────────────────────
  const [cSearch, setCSearch] = useState("");
  const [oSearch, setOSearch] = useState("");
  const [uSearch, setUSearch] = useState("");
  const [pSearch, setPSearch] = useState("");
  const [cFilter, setCFilter] = useState("all");

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const [drawer, setDrawer] = useState(false);

  // ── Cascading derived lists ────────────────────────────────────────────────

  const allCourses = useMemo(
    () => coursesByAbility.get(abilityId) ?? [],
    [abilityId],
  );

  const filteredCourses = useMemo(() => {
    let list = allCourses;
    if (cSearch) list = list.filter((c) => c.name.includes(cSearch));
    if (cFilter === "selected" && courseId)
      list = list.filter((c) => c.id === courseId);
    return list;
  }, [allCourses, cSearch, cFilter, courseId]);

  const allObjectives = useMemo(
    () => (courseId ? (objectivesByCourse.get(courseId) ?? []) : []),
    [courseId],
  );
  const filteredObjectives = useMemo(
    () =>
      oSearch
        ? allObjectives.filter((o) => o.name.includes(oSearch))
        : allObjectives,
    [allObjectives, oSearch],
  );

  // Col 3: units of the single activeObjId only
  const allUnits = useMemo(
    () => (activeObjId ? (unitsByObjective.get(activeObjId) ?? []) : []),
    [activeObjId],
  );
  const filteredUnits = useMemo(
    () =>
      uSearch ? allUnits.filter((u) => u.name.includes(uSearch)) : allUnits,
    [allUnits, uSearch],
  );

  // Col 4: points of the single activeUnitId only
  const allPoints = useMemo(
    () => (activeUnitId ? (pointsByUnit.get(activeUnitId) ?? []) : []),
    [activeUnitId],
  );
  const filteredPoints = useMemo(
    () =>
      pSearch ? allPoints.filter((p) => p.name.includes(pSearch)) : allPoints,
    [allPoints, pSearch],
  );

  const selectedPointsList = useMemo(
    () =>
      [...selectedPointIds]
        .map((id) => pointsById.get(id))
        .filter(Boolean) as KnowledgePoint[],
    [selectedPointIds],
  );

  // ── Header checkbox states ─────────────────────────────────────────────────
  // Derived entirely from selectedPointIds.

  const objSt = useMemo(() => {
    if (!filteredObjectives.length) return { checked: false, ind: false };
    let fully = 0,
      any = 0;
    for (const o of filteredObjectives) {
      const units = unitsByObjective.get(o.id) ?? [];
      let total = 0,
        picked = 0;
      for (const u of units) {
        const pts = pointsByUnit.get(u.id) ?? [];
        total += pts.length;
        for (const p of pts) if (selectedPointIds.has(p.id)) picked++;
      }
      if (total > 0 && picked === total) fully++;
      if (picked > 0) any++;
    }
    return {
      checked: fully === filteredObjectives.length,
      ind: any > 0 && fully < filteredObjectives.length,
    };
  }, [filteredObjectives, selectedPointIds]);

  const unitSt = useMemo(() => {
    if (!filteredUnits.length) return { checked: false, ind: false };
    let fully = 0,
      any = 0;
    for (const u of filteredUnits) {
      const pts = pointsByUnit.get(u.id) ?? [];
      const picked = pts.filter((p) => selectedPointIds.has(p.id)).length;
      if (pts.length > 0 && picked === pts.length) fully++;
      if (picked > 0) any++;
    }
    return {
      checked: fully === filteredUnits.length,
      ind: any > 0 && fully < filteredUnits.length,
    };
  }, [filteredUnits, selectedPointIds]);

  const pointSt = useMemo(() => {
    if (!filteredPoints.length) return { checked: false, ind: false };
    const n = filteredPoints.filter((p) => selectedPointIds.has(p.id)).length;
    return {
      checked: n === filteredPoints.length,
      ind: n > 0 && n < filteredPoints.length,
    };
  }, [filteredPoints, selectedPointIds]);

  // ── Navigation handlers ────────────────────────────────────────────────────

  const onAbility = useCallback((id: string) => {
    setAbilityId(id);
    const firstCourse = coursesByAbility.get(id)?.[0];
    const firstCourseId = firstCourse?.id ?? null;
    setCourseId(firstCourseId);
    const firstObj = firstCourseId
      ? (objectivesByCourse.get(firstCourseId)?.[0] ?? null)
      : null;
    setActiveObjId(firstObj?.id ?? null);
    const firstUnit = firstObj
      ? (unitsByObjective.get(firstObj.id)?.[0] ?? null)
      : null;
    setActiveUnitId(firstUnit?.id ?? null);
    setCSearch("");
    setOSearch("");
    setUSearch("");
    setPSearch("");
    // Do NOT touch selectedPointIds
  }, []);

  const onCourse = useCallback(
    (id: string) => {
      if (courseId === id) {
        // Toggle off
        setCourseId(null);
        setActiveObjId(null);
        setActiveUnitId(null);
      } else {
        setCourseId(id);
        const firstObj = objectivesByCourse.get(id)?.[0] ?? null;
        setActiveObjId(firstObj?.id ?? null);
        const firstUnit = firstObj
          ? (unitsByObjective.get(firstObj.id)?.[0] ?? null)
          : null;
        setActiveUnitId(firstUnit?.id ?? null);
      }
      setOSearch("");
      setUSearch("");
      setPSearch("");
      // Do NOT clear selectedPointIds
    },
    [courseId],
  );

  // ── Row navigation handlers (clicking a row → show its children) ───────────

  const onClickObjRow = useCallback((id: string) => {
    setActiveObjId(id);
    const firstUnit = unitsByObjective.get(id)?.[0] ?? null;
    setActiveUnitId(firstUnit?.id ?? null);
  }, []);

  const onClickUnitRow = useCallback((id: string) => {
    setActiveUnitId(id);
  }, []);

  // ── Checkbox toggle handlers (clicking a checkbox → select/deselect) ────────

  const onToggleObjCheckbox = useCallback((id: string) => {
    startTransition(() => {
      const units = unitsByObjective.get(id) ?? [];
      const allPtIds = units.flatMap((u) =>
        (pointsByUnit.get(u.id) ?? []).map((p) => p.id),
      );
      setSelectedPointIds((prev) => {
        const allSelected =
          allPtIds.length > 0 && allPtIds.every((pid) => prev.has(pid));
        const next = new Set(prev);
        if (allSelected) {
          allPtIds.forEach((pid) => next.delete(pid));
        } else {
          allPtIds.forEach((pid) => next.add(pid));
        }
        return next;
      });
    });
  }, []);

  const onToggleUnitCheckbox = useCallback((id: string) => {
    startTransition(() => {
      const ptIds = (pointsByUnit.get(id) ?? []).map((p) => p.id);
      setSelectedPointIds((prev) => {
        const allSelected =
          ptIds.length > 0 && ptIds.every((pid) => prev.has(pid));
        const next = new Set(prev);
        if (allSelected) {
          ptIds.forEach((pid) => next.delete(pid));
        } else {
          ptIds.forEach((pid) => next.add(pid));
        }
        return next;
      });
    });
  }, []);

  // Points have no children → no startTransition needed
  const onTogglePointCheckbox = useCallback((id: string) => {
    setSelectedPointIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Select-all handlers ────────────────────────────────────────────────────

  const onAllObj = useCallback(() => {
    const allPtIds = filteredObjectives.flatMap((o) => {
      const units = unitsByObjective.get(o.id) ?? [];
      return units.flatMap((u) =>
        (pointsByUnit.get(u.id) ?? []).map((p) => p.id),
      );
    });
    startTransition(() => {
      setSelectedPointIds((prev) => {
        const allSelected =
          allPtIds.length > 0 && allPtIds.every((pid) => prev.has(pid));
        const next = new Set(prev);
        if (allSelected) {
          allPtIds.forEach((pid) => next.delete(pid));
        } else {
          allPtIds.forEach((pid) => next.add(pid));
        }
        return next;
      });
    });
  }, [filteredObjectives]);

  const onAllUnit = useCallback(() => {
    const allPtIds = filteredUnits.flatMap((u) =>
      (pointsByUnit.get(u.id) ?? []).map((p) => p.id),
    );
    startTransition(() => {
      setSelectedPointIds((prev) => {
        const allSelected =
          allPtIds.length > 0 && allPtIds.every((pid) => prev.has(pid));
        const next = new Set(prev);
        if (allSelected) {
          allPtIds.forEach((pid) => next.delete(pid));
        } else {
          allPtIds.forEach((pid) => next.add(pid));
        }
        return next;
      });
    });
  }, [filteredUnits]);

  const onAllPoint = useCallback(() => {
    const ids = filteredPoints.map((p) => p.id);
    startTransition(() => {
      setSelectedPointIds((prev) => {
        const allSelected = ids.length > 0 && ids.every((pid) => prev.has(pid));
        const next = new Set(prev);
        if (allSelected) {
          ids.forEach((pid) => next.delete(pid));
        } else {
          ids.forEach((pid) => next.add(pid));
        }
        return next;
      });
    });
  }, [filteredPoints]);

  const onDelPoint = useCallback((id: string) => {
    setSelectedPointIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ── Row renderers ──────────────────────────────────────────────────────────
  //
  // Clicking a ROW  → navigation (setActive*)
  // Clicking a CHECKBOX → selection (toggle selectedPointIds)
  // Checkbox's built-in onClick stopPropagation prevents the row click from
  // also firing when the checkbox is clicked.

  const renderObjective = useCallback(
    (obj: CourseObjective) => {
      const units = unitsByObjective.get(obj.id) ?? [];
      let total = 0,
        picked = 0;
      for (const u of units) {
        const pts = pointsByUnit.get(u.id) ?? [];
        total += pts.length;
        for (const p of pts) if (selectedPointIds.has(p.id)) picked++;
      }
      const isChecked = total > 0 && picked === total;
      const isIndet = picked > 0 && picked < total;
      const isActive = activeObjId === obj.id;
      const hasAny = picked > 0;

      return (
        <div
          className={`flex items-center gap-2 px-4 h-full border-b border-gray-50 transition-colors cursor-pointer select-none ${
            isActive
              ? "bg-indigo-50 border-l-2 border-l-indigo-400"
              : hasAny
                ? "bg-teal-50 hover:bg-teal-100/60"
                : "hover:bg-gray-50"
          }`}
          onClick={() => onClickObjRow(obj.id)}
        >
          <span className="text-gray-300 text-sm w-4 shrink-0">—</span>
          <span
            className={`flex-1 text-sm truncate ${
              isActive
                ? "text-indigo-800 font-semibold"
                : hasAny
                  ? "text-teal-900 font-medium"
                  : "text-gray-700"
            }`}
          >
            {obj.name}
          </span>
          <Checkbox
            checked={isChecked}
            indeterminate={isIndet}
            onChange={() => onToggleObjCheckbox(obj.id)}
          />
        </div>
      );
    },
    [selectedPointIds, activeObjId, onClickObjRow, onToggleObjCheckbox],
  );

  const renderUnit = useCallback(
    (unit: KnowledgeUnit) => {
      const pts = pointsByUnit.get(unit.id) ?? [];
      const picked = pts.filter((p) => selectedPointIds.has(p.id)).length;
      const isChecked = pts.length > 0 && picked === pts.length;
      const isIndet = picked > 0 && picked < pts.length;
      const isActive = activeUnitId === unit.id;
      const hasAny = picked > 0;

      return (
        <div
          className={`flex items-center gap-3 px-4 h-full border-b border-gray-50 transition-colors cursor-pointer select-none ${
            isActive
              ? "bg-indigo-50 border-l-2 border-l-indigo-400"
              : hasAny
                ? "bg-teal-50 hover:bg-teal-100/60"
                : "hover:bg-gray-50"
          }`}
          onClick={() => onClickUnitRow(unit.id)}
        >
          <span
            className={`flex-1 text-sm truncate ${
              isActive
                ? "text-indigo-800 font-semibold"
                : hasAny
                  ? "text-teal-900 font-semibold"
                  : "text-gray-800 font-medium"
            }`}
          >
            {unit.name}
          </span>
          <Checkbox
            checked={isChecked}
            indeterminate={isIndet}
            onChange={() => onToggleUnitCheckbox(unit.id)}
          />
        </div>
      );
    },
    [selectedPointIds, activeUnitId, onClickUnitRow, onToggleUnitCheckbox],
  );

  const renderPoint = useCallback(
    (point: KnowledgePoint) => {
      const on = selectedPointIds.has(point.id);
      return (
        <div
          className={`flex items-center gap-3 px-4 h-full border-b border-gray-50 transition-colors cursor-pointer select-none ${
            on ? "bg-teal-50" : "hover:bg-gray-50"
          }`}
          onClick={() => onTogglePointCheckbox(point.id)}
        >
          <span
            className={`flex-1 text-sm truncate ${
              on ? "text-teal-900 font-medium" : "text-gray-700"
            }`}
          >
            {point.name}
          </span>
          <Checkbox
            checked={on}
            onChange={() => onTogglePointCheckbox(point.id)}
          />
        </div>
      );
    },
    [selectedPointIds, onTogglePointCheckbox],
  );

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    // h-full fills the fixed parent set by page.tsx
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* ━━━━ Left sidebar – Abilities ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-52 shrink-0 bg-white border-r border-gray-100 overflow-y-auto flex flex-col">
        {mockData.abilityGroups.map((g) => (
          <div key={g.id}>
            <p className="px-4 pt-4 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white z-10 border-b border-gray-50">
              {g.name}
            </p>
            <div className="py-1">
              {g.abilities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAbility(a.id)}
                  className={`flex items-center gap-2 mx-2 mb-0.5 px-2.5 py-2 rounded-lg text-left transition-all w-[calc(100%-1rem)] ${
                    abilityId === a.id
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-[11px] font-mono shrink-0 ${abilityId === a.id ? "text-green-100" : "text-gray-400"}`}
                  >
                    {String(a.index).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-xs font-medium truncate leading-5">
                    {a.name}
                  </span>
                  {a.isAI && <AIBadge />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ━━━━ Four cascading panels ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-1 min-w-0 overflow-x-auto">
        {/* ── Panel 1: 相关课程 ─────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">相关课程</h3>
            <div className="relative">
              <select
                value={cFilter}
                onChange={(e) => setCFilter(e.target.value)}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="all">全部</option>
                <option value="selected">已选</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <SearchBar
            value={cSearch}
            onChange={setCSearch}
            placeholder="搜索课程"
          />
          <div className="flex-1 overflow-y-auto">
            {filteredCourses.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-8">
                无匹配课程
              </p>
            ) : (
              filteredCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCourse(c.id)}
                  className={`w-full group flex items-center justify-between px-4 py-3.5 text-left text-sm border-b border-gray-50 transition-all ${
                    courseId === c.id
                      ? "bg-blue-50 font-semibold text-blue-800"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (courseId === c.id) {
                        setCourseId(null);
                        setActiveObjId(null);
                        setActiveUnitId(null);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 ml-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Panel 2: 相关课程目标 ─────────────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <PanelHeader
            title="相关课程目标"
            checked={objSt.checked}
            indeterminate={objSt.ind}
            onSelectAll={onAllObj}
          />
          <SearchBar
            value={oSearch}
            onChange={setOSearch}
            placeholder="搜索课程目标"
          />
          <VirtualList
            items={filteredObjectives}
            renderItem={renderObjective}
            empty={courseId ? "无匹配目标" : "请先选择课程"}
          />
        </div>

        {/* ── Panel 3: 知识点单元 ───────────────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <PanelHeader
            title="知识点单元"
            checked={unitSt.checked}
            indeterminate={unitSt.ind}
            onSelectAll={onAllUnit}
          />
          <SearchBar
            value={uSearch}
            onChange={setUSearch}
            placeholder="搜索知识点单元"
          />
          <VirtualList
            items={filteredUnits}
            renderItem={renderUnit}
            empty="请先点击课程目标"
          />
        </div>

        {/* ── Panel 4: 相关知识点 ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-72 bg-white flex flex-col">
          <PanelHeader
            title="相关知识点"
            checked={pointSt.checked}
            indeterminate={pointSt.ind}
            onSelectAll={onAllPoint}
          />
          <SearchBar
            value={pSearch}
            onChange={setPSearch}
            placeholder="搜索知识点"
          />
          <VirtualList
            items={filteredPoints}
            renderItem={renderPoint}
            empty="请先点击知识点单元"
          />
        </div>
      </div>

      {/* ━━━━ Floating trigger (right-middle, visible when points selected) ━━━ */}
      {selectedPointIds.size > 0 && !drawer && (
        <button
          onClick={() => setDrawer(true)}
          title="查看已选知识点"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-l-2xl shadow-xl transition-all flex flex-col items-center gap-1.5 px-3 py-5"
        >
          <List className="w-4 h-4" />
          <span
            className="text-[11px] font-semibold"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            已选知识点
          </span>
          <span className="text-lg font-bold leading-none">
            {selectedPointIds.size}
          </span>
        </button>
      )}

      {/* ━━━━ Right drawer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {drawer && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-50"
            style={{ backdropFilter: "blur(2px)" }}
            onClick={() => setDrawer(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white z-[51] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">
                已选知识点
                <span className="ml-2 text-sm text-gray-400 font-normal">
                  ({selectedPointIds.size})
                </span>
              </h2>
              <button
                onClick={() => setDrawer(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {selectedPointsList.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-12">
                  暂无选中的知识点
                </p>
              ) : (
                selectedPointsList.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl group transition-colors ${
                      p.isAI
                        ? "bg-purple-50 hover:bg-purple-100/60"
                        : "bg-gray-50 hover:bg-gray-100/60"
                    }`}
                  >
                    {p.isAI && <AIBadge />}
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {p.name}
                    </span>
                    <button
                      onClick={() => onDelPoint(p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
              <button
                onClick={() => setDrawer(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200/60"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </>
      )}

      {/* Subtle pending indicator for heavy transitions */}
      {isPending && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900/70 text-white text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            处理中…
          </div>
        </div>
      )}
    </div>
  );
}
