"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
  Sparkles,
  List,
  Check,
  X,
  Zap,
} from "lucide-react";
import {
  mockData,
  coursesByAbility as rawCoursesByAbility,
  objectivesByCourse,
  unitsByObjective,
  pointsByUnit,
} from "./data";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditAbilityGroup = { id: string; name: string; abilities: EditAbility[] };
type EditAbility = {
  id: string;
  name: string;
  isAI?: boolean;
  isNew?: boolean;
  index: number;
};
type EditCourse = {
  id: string;
  abilityId: string;
  name: string;
  status: "complete" | "pending";
  units: EditUnit[];
  objectives: EditObjective[];
};
type EditUnit = {
  id: string;
  name: string;
  totalPoints: number;
  points: EditPoint[];
};
type EditPoint = { id: string; name: string };
type EditObjective = { id: string; name: string };

type AppState = {
  groups: EditAbilityGroup[];
  courseMap: Record<string, EditCourse[]>;
};

// ─── Drag props ───────────────────────────────────────────────────────────────

interface DragProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

// ─── useDragList hook ─────────────────────────────────────────────────────────

function useDragList<T extends { id: string }>(
  items: T[],
  onChange: (newItems: T[]) => void,
) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function getItemProps(index: number): DragProps {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.stopPropagation();
        setDragIdx(index);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOverIdx(index);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragIdx !== null && dragIdx !== index) {
          const arr = [...items];
          const [moved] = arr.splice(dragIdx, 1);
          arr.splice(index, 0, moved);
          onChange(arr);
        }
        setDragIdx(null);
        setOverIdx(null);
      },
      onDragEnd: () => {
        setDragIdx(null);
        setOverIdx(null);
      },
    };
  }

  return { dragIdx, overIdx, getItemProps };
}

// ─── buildInitialState ────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const groups: EditAbilityGroup[] = mockData.abilityGroups.map((g) => ({
    id: g.id,
    name: g.name,
    abilities: g.abilities.map((a) => ({
      id: a.id,
      name: a.name,
      isAI: a.isAI,
      isNew: a.index % 3 === 0,
      index: a.index,
    })),
  }));

  const courseMap: Record<string, EditCourse[]> = {};

  for (const group of mockData.abilityGroups) {
    for (const ability of group.abilities) {
      const rawCourses = rawCoursesByAbility.get(ability.id) ?? [];
      courseMap[ability.id] = rawCourses.map((c, i) => {
        if (i < 2) {
          // complete: fill with first 2 objs × first 2 units × first 4 points
          const rawObjs = objectivesByCourse.get(c.id) ?? [];
          const units: EditUnit[] = [];
          for (const obj of rawObjs.slice(0, 2)) {
            for (const u of (unitsByObjective.get(obj.id) ?? []).slice(0, 2)) {
              const pts = pointsByUnit.get(u.id) ?? [];
              units.push({
                id: u.id,
                name: u.name,
                totalPoints: pts.length,
                points: pts
                  .slice(0, 4)
                  .map((p) => ({ id: p.id, name: p.name })),
              });
            }
          }
          return {
            id: c.id,
            abilityId: ability.id,
            name: c.name,
            status: "complete" as const,
            units,
            objectives: rawObjs
              .slice(0, 3)
              .map((o) => ({ id: o.id, name: o.name })),
          };
        }
        return {
          id: c.id,
          abilityId: ability.id,
          name: c.name,
          status: "pending" as const,
          units: [],
          objectives: [],
        };
      });
    }
  }

  return { groups, courseMap };
}

// ─── AIBadge ─────────────────────────────────────────────────────────────────

function AIBadge() {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-bold flex-shrink-0 leading-none"
      style={{
        fontSize: 9,
        background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
      }}
    >
      AI
    </span>
  );
}

// ─── NewBadge ─────────────────────────────────────────────────────────────────

function NewBadge() {
  return (
    <span
      className="inline-flex items-center px-1 py-0.5 rounded-full text-white font-bold bg-amber-400 flex-shrink-0 leading-none"
      style={{ fontSize: 9 }}
    >
      NEW
    </span>
  );
}

// ─── PointChip ───────────────────────────────────────────────────────────────

function PointChip({
  point,
  editMode,
  onRemove,
  dragProps,
  isOver,
  isDragging,
}: {
  point: EditPoint;
  editMode: boolean;
  onRemove?: () => void;
  dragProps?: DragProps;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  return (
    <span
      {...dragProps}
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium select-none",
        "bg-indigo-50 text-indigo-700 cursor-grab",
        isDragging ? "opacity-40" : "",
        isOver ? "border-l-2 border-indigo-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Check className="h-3 w-3 text-indigo-400 flex-shrink-0" />
      <span className="max-w-[96px] truncate">{point.name}</span>
      {editMode && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ─── ObjectiveChip ────────────────────────────────────────────────────────────

function ObjectiveChip({
  obj,
  editMode,
  onRemove,
  dragProps,
  isOver,
  isDragging,
}: {
  obj: EditObjective;
  editMode: boolean;
  onRemove?: () => void;
  dragProps?: DragProps;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  return (
    <span
      {...dragProps}
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium select-none",
        "bg-violet-50 text-violet-700 cursor-grab",
        isDragging ? "opacity-40" : "",
        isOver ? "border-l-2 border-violet-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Check className="h-3 w-3 text-violet-400 flex-shrink-0" />
      <span className="max-w-[120px] truncate">{obj.name}</span>
      {editMode && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Uncontrolled input — imperatively update the DOM value when page changes
  // so we never call setState inside an effect.
  const gotoRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (gotoRef.current) gotoRef.current.value = String(page);
  }, [page]);

  const pages = useMemo<(number | "...")[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      result.push(i);
    }
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-center gap-1.5 py-3 text-sm text-gray-600 flex-wrap">
      <span className="text-gray-400 text-xs mr-1">共 {total} 条</span>
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="text-gray-400 select-none px-1">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={[
              "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
              p === page
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-100 text-gray-600",
            ].join(" ")}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500"
      >
        ›
      </button>
      <span className="ml-1 text-gray-400 text-xs">前往</span>
      <input
        ref={gotoRef}
        type="number"
        min={1}
        max={totalPages}
        defaultValue={String(page)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const n = parseInt(e.currentTarget.value, 10);
            if (!isNaN(n) && n >= 1 && n <= totalPages) onPage(n);
          }
        }}
        className="w-12 border border-gray-200 rounded px-1 py-0.5 text-center text-xs"
      />
      <span className="text-gray-400 text-xs">页</span>
    </div>
  );
}

// ─── AbilityGroupSection ──────────────────────────────────────────────────────
// Isolated component so useDragList can be called once per group (not in a loop)

function AbilityGroupSection({
  group,
  selectedAbilityId,
  onSelectAbility,
  onReorder,
}: {
  group: EditAbilityGroup;
  selectedAbilityId: string;
  onSelectAbility: (id: string) => void;
  onReorder: (newAbilities: EditAbility[]) => void;
}) {
  const { dragIdx, overIdx, getItemProps } = useDragList(
    group.abilities,
    onReorder,
  );

  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
        {group.name}
      </div>
      <div className="space-y-0.5">
        {group.abilities.map((ability, aIdx) => {
          const isSelected = ability.id === selectedAbilityId;
          return (
            <div
              key={ability.id}
              {...getItemProps(aIdx)}
              onClick={() => onSelectAbility(ability.id)}
              className={[
                "flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all select-none",
                isSelected
                  ? "bg-green-500 text-white"
                  : "text-gray-600 hover:bg-gray-50",
                dragIdx === aIdx ? "opacity-40" : "",
                overIdx === aIdx && dragIdx !== aIdx
                  ? "border-t-2 border-indigo-500"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  "font-mono text-[9px] flex-shrink-0",
                  isSelected ? "text-green-100" : "text-gray-400",
                ].join(" ")}
              >
                {String(aIdx + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 min-w-0 truncate leading-tight">
                {ability.name}
              </span>
              {ability.isAI && <AIBadge />}
              {ability.isNew && <NewBadge />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── UnitRow ──────────────────────────────────────────────────────────────────
// Isolated component so useDragList for points is called once per row

function UnitRow({
  unit,
  editMode,
  onRemovePoint,
  onUpdatePoints,
  dragProps,
  isOver,
  isDragging,
}: {
  unit: EditUnit;
  editMode: boolean;
  onRemovePoint: (pid: string) => void;
  onUpdatePoints: (pts: EditPoint[]) => void;
  dragProps?: DragProps;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  const {
    dragIdx: pDragIdx,
    overIdx: pOverIdx,
    getItemProps: getPtProps,
  } = useDragList(unit.points, onUpdatePoints);

  return (
    <div
      {...dragProps}
      className={[
        "flex items-start gap-2 py-1.5 rounded",
        isDragging ? "opacity-40" : "",
        isOver ? "border-t-2 border-indigo-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap pt-0.5 min-w-[88px] flex-shrink-0">
        {unit.name}
        {editMode && (
          <span className="ml-1 text-gray-400 font-normal text-[10px]">
            {unit.points.length}/{unit.totalPoints}
          </span>
        )}
      </span>
      <div className="flex flex-wrap gap-1">
        {unit.points.map((point, pIdx) => (
          <PointChip
            key={point.id}
            point={point}
            editMode={editMode}
            onRemove={() => onRemovePoint(point.id)}
            dragProps={getPtProps(pIdx)}
            isOver={pOverIdx === pIdx && pDragIdx !== pIdx}
            isDragging={pDragIdx === pIdx}
          />
        ))}
      </div>
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────
// Isolated component so useDragList for units/objectives is called once per card

function CourseCard({
  course,
  index,
  editMode,
  expanded,
  selected,
  onToggleSelect,
  onToggleExpand,
  onEnterEdit,
  onSaveEdit,
  onDelete,
  onQuickFill,
  onUpdateCourse,
  dragProps,
  isOver,
  isDragging,
}: {
  course: EditCourse;
  index: number;
  editMode: boolean;
  expanded: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onEnterEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onQuickFill: () => void;
  onUpdateCourse: (updated: EditCourse) => void;
  dragProps?: DragProps;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);

  const {
    dragIdx: uDragIdx,
    overIdx: uOverIdx,
    getItemProps: getUnitProps,
  } = useDragList(course.units, (newUnits) =>
    onUpdateCourse({ ...course, units: newUnits }),
  );

  const {
    dragIdx: oDragIdx,
    overIdx: oOverIdx,
    getItemProps: getObjProps,
  } = useDragList(course.objectives, (newObjs) =>
    onUpdateCourse({ ...course, objectives: newObjs }),
  );

  const handleSave = () => {
    if (nameRef.current) {
      const raw = nameRef.current.textContent ?? course.name;
      const newName = raw.trim() || course.name;
      if (newName !== course.name) {
        onUpdateCourse({ ...course, name: newName });
      }
    }
    onSaveEdit();
  };

  return (
    <div
      {...dragProps}
      className={[
        "bg-white rounded-xl shadow-sm transition-all",
        editMode
          ? "border-2 border-dashed border-indigo-400"
          : "border border-gray-100",
        isDragging ? "opacity-40" : "",
        isOver && !editMode ? "border-t-2 border-indigo-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Card header row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
        />

        {/* Numbered badge */}
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Course name */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {editMode ? (
            <>
              <span className="text-gray-400 font-semibold select-none">
                《
              </span>
              <span
                ref={nameRef}
                contentEditable
                suppressContentEditableWarning
                onDoubleClick={(e) => e.currentTarget.focus()}
                className="font-semibold text-gray-900 outline-none border-b border-dashed border-indigo-300 min-w-[60px] focus:border-indigo-500 transition-colors"
              >
                {course.name}
              </span>
              <span className="text-gray-400 font-semibold select-none">
                》
              </span>
              <span className="text-[10px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap ml-1">
                双击可编辑文字
              </span>
            </>
          ) : (
            <button
              onClick={onToggleExpand}
              className="font-semibold text-gray-900 text-left hover:text-indigo-700 transition-colors truncate"
            >
              《{course.name}》
            </button>
          )}
        </div>

        {/* Status dot */}
        <span
          className={[
            "inline-flex items-center gap-1 text-xs font-medium flex-shrink-0",
            course.status === "complete" ? "text-green-600" : "text-red-400",
          ].join(" ")}
        >
          <span
            className={[
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              course.status === "complete" ? "bg-green-500" : "bg-red-400",
            ].join(" ")}
          />
          {course.status === "complete" ? "已补充" : "未补充"}
        </span>

        {/* 一键补充 (pending, view mode only) */}
        {course.status === "pending" && !editMode && (
          <button
            onClick={onQuickFill}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Zap className="h-3 w-3" />
            一键补充
          </button>
        )}

        {/* Edit / Save / Delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {editMode ? (
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
            >
              <Save className="h-3 w-3" />
              保存
            </button>
          ) : (
            <>
              <button
                onClick={onEnterEdit}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title="编辑"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              {course.status === "pending" && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Expanded body ─────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          {/* Knowledge units + points */}
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              ▼ 相关知识点单元-知识点
            </div>
            {course.units.length === 0 ? (
              <div className="text-xs text-gray-300 italic">暂无知识点单元</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {course.units.map((unit, uIdx) => (
                  <UnitRow
                    key={unit.id}
                    unit={unit}
                    editMode={editMode}
                    onRemovePoint={(pid) =>
                      onUpdateCourse({
                        ...course,
                        units: course.units.map((u) =>
                          u.id === unit.id
                            ? {
                                ...u,
                                points: u.points.filter((p) => p.id !== pid),
                              }
                            : u,
                        ),
                      })
                    }
                    onUpdatePoints={(pts) =>
                      onUpdateCourse({
                        ...course,
                        units: course.units.map((u) =>
                          u.id === unit.id ? { ...u, points: pts } : u,
                        ),
                      })
                    }
                    dragProps={getUnitProps(uIdx)}
                    isOver={uOverIdx === uIdx && uDragIdx !== uIdx}
                    isDragging={uDragIdx === uIdx}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Objectives */}
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              ▼ 课程目标
            </div>
            {course.objectives.length === 0 ? (
              <div className="text-xs text-gray-300 italic">暂无课程目标</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {course.objectives.map((obj, oIdx) => (
                  <ObjectiveChip
                    key={obj.id}
                    obj={obj}
                    editMode={editMode}
                    onRemove={() =>
                      onUpdateCourse({
                        ...course,
                        objectives: course.objectives.filter(
                          (o) => o.id !== obj.id,
                        ),
                      })
                    }
                    dragProps={getObjProps(oIdx)}
                    isOver={oOverIdx === oIdx && oDragIdx !== oIdx}
                    isDragging={oDragIdx === oIdx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CompletedCourseItem ──────────────────────────────────────────────────────

function CompletedCourseItem({
  course,
  included,
  onToggle,
  dragProps,
  isOver,
  isDragging,
}: {
  course: EditCourse;
  included: boolean;
  onToggle: () => void;
  dragProps?: DragProps;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  const totalPoints = course.units.reduce((s, u) => s + u.points.length, 0);

  return (
    <div
      {...dragProps}
      className={[
        "p-3 rounded-lg bg-gray-50 border border-gray-200 transition-opacity cursor-grab",
        isDragging ? "opacity-40" : "",
        isOver ? "border-t-2 border-indigo-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-800 truncate">
            {course.name}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            已选 {totalPoints}个知识点 {course.objectives.length}个课程目标
          </div>
        </div>
        <input
          type="checkbox"
          checked={included}
          onChange={onToggle}
          className="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0 mt-0.5"
        />
      </div>
    </div>
  );
}

// ─── EditPage ─────────────────────────────────────────────────────────────────

export function EditPage() {
  // ── Core state ─────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<EditAbilityGroup[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, EditCourse[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedAbilityId, setSelectedAbilityId] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "pending"
  >("all");
  const [expandAll, setExpandAll] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editModeCard, setEditModeCard] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // ── Right-sidebar state ────────────────────────────────────────────────────
  const [completedCourses, setCompletedCourses] = useState<EditCourse[]>([]);
  const [includedInSave, setIncludedInSave] = useState<Set<string>>(new Set());
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/knowledge-map")
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => {
        const state: AppState =
          json.data !== null && json.data
            ? (json.data as AppState)
            : buildInitialState();
        setGroups(state.groups);
        setCourseMap(state.courseMap);
        const firstAbility = state.groups[0]?.abilities[0];
        if (firstAbility) setSelectedAbilityId(firstAbility.id);
        const completed: EditCourse[] = [];
        for (const courses of Object.values(state.courseMap)) {
          for (const c of courses) {
            if (c.status === "complete") completed.push(c);
          }
        }
        setCompletedCourses(completed);
        setIncludedInSave(new Set(completed.map((c) => c.id)));
      })
      .catch(() => {
        const state = buildInitialState();
        setGroups(state.groups);
        setCourseMap(state.courseMap);
        const firstAbility = state.groups[0]?.abilities[0];
        if (firstAbility) setSelectedAbilityId(firstAbility.id);
        const completed: EditCourse[] = [];
        for (const courses of Object.values(state.courseMap)) {
          for (const c of courses) {
            if (c.status === "complete") completed.push(c);
          }
        }
        setCompletedCourses(completed);
        setIncludedInSave(new Set(completed.map((c) => c.id)));
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedGroup = useMemo(
    () =>
      groups.find((g) => g.abilities.some((a) => a.id === selectedAbilityId)) ??
      null,
    [groups, selectedAbilityId],
  );

  const selectedAbility = useMemo(
    () =>
      selectedGroup?.abilities.find((a) => a.id === selectedAbilityId) ?? null,
    [selectedGroup, selectedAbilityId],
  );

  const allCoursesForAbility = useMemo(
    () => courseMap[selectedAbilityId] ?? [],
    [courseMap, selectedAbilityId],
  );

  const filteredCourses = useMemo(() => {
    let list = allCoursesForAbility;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list;
  }, [allCoursesForAbility, searchQuery, statusFilter]);

  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, page]);

  const completedCount = useMemo(
    () => allCoursesForAbility.filter((c) => c.status === "complete").length,
    [allCoursesForAbility],
  );

  // ── Drag lists ─────────────────────────────────────────────────────────────
  const {
    dragIdx: cDragIdx,
    overIdx: cOverIdx,
    getItemProps: getCourseProps,
  } = useDragList(allCoursesForAbility, (newCourses) =>
    setCourseMap((prev) => ({ ...prev, [selectedAbilityId]: newCourses })),
  );

  const {
    dragIdx: ccDragIdx,
    overIdx: ccOverIdx,
    getItemProps: getCompletedProps,
  } = useDragList(completedCourses, setCompletedCourses);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAbilityReorder = useCallback(
    (groupId: string, newAbilities: EditAbility[]) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, abilities: newAbilities } : g,
        ),
      );
    },
    [],
  );

  const handleUpdateCourse = useCallback(
    (courseId: string, updated: EditCourse) => {
      setCourseMap((prev) => ({
        ...prev,
        [updated.abilityId]: (prev[updated.abilityId] ?? []).map((c) =>
          c.id === courseId ? updated : c,
        ),
      }));
      if (updated.status === "complete") {
        setCompletedCourses((prev) => {
          const exists = prev.some((c) => c.id === updated.id);
          return exists
            ? prev.map((c) => (c.id === updated.id ? updated : c))
            : [...prev, updated];
        });
        setIncludedInSave((prev) => new Set([...prev, updated.id]));
      }
    },
    [],
  );

  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      setCourseMap((prev) => ({
        ...prev,
        [selectedAbilityId]: (prev[selectedAbilityId] ?? []).filter(
          (c) => c.id !== courseId,
        ),
      }));
    },
    [selectedAbilityId],
  );

  const handleQuickFill = useCallback(
    (courseId: string) => {
      const courses = courseMap[selectedAbilityId] ?? [];
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const rawObjs = objectivesByCourse.get(courseId) ?? [];
      const units: EditUnit[] = [];
      for (const obj of rawObjs.slice(0, 2)) {
        for (const u of (unitsByObjective.get(obj.id) ?? []).slice(0, 2)) {
          const pts = pointsByUnit.get(u.id) ?? [];
          units.push({
            id: u.id,
            name: u.name,
            totalPoints: pts.length,
            points: pts.slice(0, 4).map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
      const filled: EditCourse = {
        ...course,
        status: "complete",
        units,
        objectives: rawObjs
          .slice(0, 3)
          .map((o) => ({ id: o.id, name: o.name })),
      };

      setCourseMap((prev) => ({
        ...prev,
        [selectedAbilityId]: (prev[selectedAbilityId] ?? []).map((c) =>
          c.id === courseId ? filled : c,
        ),
      }));
      setCompletedCourses((prev) => {
        const exists = prev.some((c) => c.id === filled.id);
        return exists
          ? prev.map((c) => (c.id === filled.id ? filled : c))
          : [...prev, filled];
      });
      setIncludedInSave((prev) => new Set([...prev, filled.id]));
    },
    [courseMap, selectedAbilityId],
  );

  const handleToggleExpand = useCallback(
    (courseId: string) => {
      if (expandAll) {
        // Turn off global expand; keep all visible except the toggled one collapsed
        setExpandAll(false);
        setExpandedCards(
          new Set(
            filteredCourses.filter((c) => c.id !== courseId).map((c) => c.id),
          ),
        );
      } else {
        setExpandedCards((prev) => {
          const next = new Set(prev);
          if (next.has(courseId)) next.delete(courseId);
          else next.add(courseId);
          return next;
        });
      }
    },
    [expandAll, filteredCourses],
  );

  const handleExpandAll = useCallback(() => {
    setExpandAll((prev) => {
      if (prev) setExpandedCards(new Set());
      return !prev;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/knowledge-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups, courseMap }),
      });
    } finally {
      setSaving(false);
    }
  }, [groups, courseMap]);

  // Page resets happen at call-sites (search / filter / ability changes) — no
  // useEffect needed; keeping state-setter calls out of effects avoids cascades.

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* ──────────────── Left Sidebar ───────────────────────────────────── */}
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-3">
          {groups.map((group) => (
            <AbilityGroupSection
              key={group.id}
              group={group}
              selectedAbilityId={selectedAbilityId}
              onSelectAbility={(id) => {
                setSelectedAbilityId(id);
                setPage(1);
              }}
              onReorder={(newAbilities) =>
                handleAbilityReorder(group.id, newAbilities)
              }
            />
          ))}
        </div>
      </aside>

      {/* ──────────────── Main Content ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            {/* Title + controls */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-gray-900 mb-3 leading-snug">
                <span className="text-gray-500">
                  {selectedGroup?.name ?? ""}
                </span>
                <span className="mx-1 text-gray-300">-</span>
                <span>{selectedAbility?.name ?? ""}</span>
                <span className="ml-2 text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  AI课程 {completedCount}个
                </span>
                <span className="ml-1 text-xs font-normal text-gray-400">
                  · 展示近1年的课程
                </span>
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="搜索课程..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-44"
                  />
                </div>

                {/* Status filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(
                        e.target.value as "all" | "complete" | "pending",
                      );
                      setPage(1);
                    }}
                    className="pl-3 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="all">全部状态</option>
                    <option value="complete">已补充</option>
                    <option value="pending">未补充</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>

                {/* Expand / collapse all */}
                <button
                  onClick={handleExpandAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <List className="h-3.5 w-3.5" />
                  {expandAll ? "折叠全部" : "展开全部"}
                </button>
              </div>
            </div>

            {/* AI assistant banner */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-700">
                  AI 智能助手
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  自动补充知识点与课程目标
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {paginatedCourses.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              暂无课程数据
            </div>
          ) : (
            paginatedCourses.map((course) => {
              const globalIdx = allCoursesForAbility.findIndex(
                (c) => c.id === course.id,
              );
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={globalIdx}
                  editMode={editModeCard === course.id}
                  expanded={expandedCards.has(course.id) || expandAll}
                  selected={selectedCourseIds.has(course.id)}
                  onToggleSelect={() =>
                    setSelectedCourseIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(course.id)) next.delete(course.id);
                      else next.add(course.id);
                      return next;
                    })
                  }
                  onToggleExpand={() => handleToggleExpand(course.id)}
                  onEnterEdit={() => setEditModeCard(course.id)}
                  onSaveEdit={() => setEditModeCard(null)}
                  onDelete={() => handleDeleteCourse(course.id)}
                  onQuickFill={() => handleQuickFill(course.id)}
                  onUpdateCourse={(updated) =>
                    handleUpdateCourse(course.id, updated)
                  }
                  dragProps={getCourseProps(globalIdx)}
                  isOver={cOverIdx === globalIdx && cDragIdx !== globalIdx}
                  isDragging={cDragIdx === globalIdx}
                />
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200">
          <Pagination
            total={filteredCourses.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </div>
      </main>

      {/* ──────────────── Right Sidebar ──────────────────────────────────── */}
      <aside className="w-[280px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">
            已补充课程{" "}
            <span className="text-indigo-600">{completedCourses.length}</span>个
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {completedCourses.length === 0 ? (
            <div className="text-xs text-gray-300 text-center py-8 italic">
              暂无已补充课程
            </div>
          ) : (
            completedCourses.map((course, idx) => (
              <CompletedCourseItem
                key={course.id}
                course={course}
                included={includedInSave.has(course.id)}
                onToggle={() =>
                  setIncludedInSave((prev) => {
                    const next = new Set(prev);
                    if (next.has(course.id)) next.delete(course.id);
                    else next.add(course.id);
                    return next;
                  })
                }
                dragProps={getCompletedProps(idx)}
                isOver={ccOverIdx === idx && ccDragIdx !== idx}
                isDragging={ccDragIdx === idx}
              />
            ))
          )}
        </div>

        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </aside>
    </div>
  );
}
