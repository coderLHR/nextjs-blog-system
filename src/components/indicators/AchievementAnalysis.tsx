"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  mockData,
  coursesByAbility,
  objectivesByCourse,
} from "@/components/knowledge-map/data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Group = {
  id: string;
  name: string;
  achievement: number;
  indicators: Indicator[];
};
type Indicator = {
  id: string;
  index: number;
  name: string;
  achievement: number;
  courses: Course[];
};
type Course = {
  id: string;
  name: string;
  semester: string;
  credits: string;
  courseType: string;
  achievement: number;
  level: "H" | "M" | "L";
  objectives: Objective[];
};
type Objective = {
  id: string;
  name: string;
  achievement: number;
  assessments: Assessment[];
};
type Assessment = { id: string; type: string; achievement: number };

// ─── Deterministic mock data ──────────────────────────────────────────────────

function seed(n: number, offset = 0): number {
  const vals = [76.7, 26.7, 76.7, 76.5, 29.5, 76.3, 36.3, 56.9, 73.2, 45.1];
  return vals[((n + offset) % vals.length + vals.length) % vals.length];
}

const GROUPS: Group[] = mockData.abilityGroups.map((g, gi) => ({
  id: g.id,
  name: g.name.replace(/^\d+\.\s*/, ""),
  achievement: 78.6,
  indicators: g.abilities.map((a, ai) => ({
    id: a.id,
    index: a.index,
    name: a.name,
    achievement: seed(gi * 10 + ai),
    courses: (coursesByAbility.get(a.id) ?? []).slice(0, 3).map((c, ci) => {
      const ach = seed(gi * 50 + ai * 5 + ci + 3);
      return {
        id: c.id,
        name: c.name,
        semester: `第${ci + 1}学期`,
        credits: `${2 + ci}学分`,
        courseType: ["通识教育课", "专业必修课", "专业选修课"][ci % 3],
        achievement: ach,
        level: (ach > 60 ? "H" : ach > 35 ? "M" : "L") as "H" | "M" | "L",
        objectives: (objectivesByCourse.get(c.id) ?? [])
          .slice(0, 3)
          .map((o, oi) => ({
            id: o.id,
            name: `课程目标${oi + 1}`,
            achievement: seed(gi * 100 + ai * 20 + ci * 4 + oi + 2),
            assessments: [
              {
                id: `${o.id}-p`,
                type: "过程考核",
                achievement: seed(gi + ai + ci + oi + 1),
              },
              {
                id: `${o.id}-f`,
                type: "课程考核",
                achievement: seed(gi + ai + ci + oi + 5),
              },
            ],
          })),
      };
    }),
  })),
}));

// ─── Colour helpers ───────────────────────────────────────────────────────────

function achColor(v: number): string {
  if (v >= 60) return "#10b981";
  if (v >= 35) return "#f59e0b";
  return "#ef4444";
}

// ─── drawWheel  (left D3 semi-circle) ────────────────────────────────────────

function drawWheel(
  el: SVGSVGElement | null,
  group: Group,
  selectedId: string,
  offset: number,
  onSelect: (id: string) => void,
): void {
  if (!el) return;
  const svg = d3.select(el);
  svg.selectAll("*").remove();

  const W = 300,
    H = 360;
  const CX = 0,
    CY = H / 2; // centre at left edge → right half visible, left half clipped
  const INNER = 78,
    OUTER_N = 136,
    OUTER_S = 162;
  const VISIBLE = 7;
  const ANGLE_EACH = Math.PI / VISIBLE;

  // Defs: selected arc gradient
  const defs = svg.append("defs");
  const sg = defs
    .append("radialGradient")
    .attr("id", "selGrad")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%");
  sg.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#8b5cf6");
  sg.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4f46e5");

  const arcFn = d3.arc<d3.DefaultArcObject>();

  const visible = group.indicators.slice(offset, offset + VISIBLE);
  visible.forEach((ind, vi) => {
    const sa = -Math.PI / 2 + vi * ANGLE_EACH;
    const ea = sa + ANGLE_EACH - 0.025;
    const isSel = ind.id === selectedId;
    const outerR = isSel ? OUTER_S : OUTER_N;
    const midA = (sa + ea) / 2;

    const arcPath = arcFn({
      innerRadius: INNER,
      outerRadius: outerR,
      startAngle: sa,
      endAngle: ea,
    } as d3.DefaultArcObject);

    const g = svg
      .append("g")
      .attr("transform", `translate(${CX},${CY})`)
      .style("cursor", "pointer")
      .on("click", () => onSelect(ind.id));

    // Arc fill
    const fillColor = isSel
      ? "url(#selGrad)"
      : d3.interpolateRgb("#ddd6fe", "#c4b5fd")(vi / VISIBLE);

    g.append("path")
      .attr("d", arcPath)
      .attr("fill", fillColor)
      .attr("stroke", "white")
      .attr("stroke-width", 2.5)
      .style("filter", isSel ? "drop-shadow(0 2px 8px rgba(109,40,217,.4))" : "none");

    // Centroid for text
    const [tx, ty] = arcFn.centroid({
      innerRadius: INNER,
      outerRadius: outerR,
      startAngle: sa,
      endAngle: ea,
    } as d3.DefaultArcObject);

    const rot = (midA * 180) / Math.PI + 90;
    const tg = g
      .append("g")
      .attr("transform", `translate(${tx},${ty}) rotate(${rot})`);

    // Index badge
    tg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -16)
      .attr("fill", isSel ? "rgba(255,255,255,.75)" : "#6d28d9")
      .attr("font-size", 9)
      .text(String(ind.index).padStart(2, "0"));

    // Name (truncate)
    const label = ind.name.length > 6 ? ind.name.slice(0, 6) : ind.name;
    tg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -3)
      .attr("fill", isSel ? "white" : "#4c1d95")
      .attr("font-size", 10)
      .attr("font-weight", isSel ? "bold" : "normal")
      .text(label);

    // Achievement
    tg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 11)
      .attr("fill", isSel ? "rgba(255,255,255,.9)" : achColor(ind.achievement))
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text(`${ind.achievement}%`);
  });

  // Centre disc
  const cg = svg.append("g").attr("transform", `translate(${CX},${CY})`);
  cg.append("circle")
    .attr("r", INNER - 5)
    .attr("fill", "white")
    .attr("stroke", "#e8e0f8")
    .attr("stroke-width", 2);
  cg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", -22)
    .attr("fill", "#1e1b4b")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .text(group.name.length > 5 ? group.name.slice(0, 5) : group.name);
  cg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 8)
    .attr("fill", "#6d28d9")
    .attr("font-size", 28)
    .attr("font-weight", "bold")
    .text(`${group.achievement}%`);
  cg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 28)
    .attr("fill", "#6b7280")
    .attr("font-size", 11)
    .text("能力达成度");
}

// ─── drawDiagram  (right D3 connection view) ──────────────────────────────────

interface Pos {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  parentId?: string;
}

function drawDiagram(
  el: SVGSVGElement | null,
  group: Group,
  indicator: Indicator,
  containerW: number,
  containerH: number,
): void {
  if (!el) return;
  const svg = d3.select(el);
  svg.selectAll("*").remove();

  // ── layout constants ────────────────────────────────────────────────────
  const PAD = { top: 16, left: 8 };
  const IND_W = 158,
    CRS_W = 210,
    OBJ_W = 148,
    ASS_W = 148;
  const GAP = 52; // gap between columns (where connections travel)
  const IH = 66,
    IGAP = 10; // indicator item height & gap
  const CH = 72,
    CGAP = 18;
  const OH = 64,
    OGAP = 8;
  const AH = 28,
    AGAP = 4;

  const col1X = PAD.left;
  const col2X = col1X + IND_W + GAP;
  const col3X = col2X + CRS_W + GAP;
  const col4X = col3X + OBJ_W + GAP;
  const totalW = col4X + ASS_W + PAD.left;

  // ── position calculation ────────────────────────────────────────────────
  const indPos: Pos[] = group.indicators.map((ind, i) => ({
    id: ind.id,
    x: col1X,
    y: PAD.top + i * (IH + IGAP),
    w: IND_W,
    h: IH,
    data: ind,
  }));

  const coursePos: Pos[] = [];
  const objPos: Pos[] = [];
  const assPos: Pos[] = [];

  const selIndP = indPos.find((p) => p.id === indicator.id)!;
  let baseY = selIndP ? selIndP.y : PAD.top;

  indicator.courses.forEach((course) => {
    const courseStartY = baseY;
    let objCursor = courseStartY;

    course.objectives.forEach((obj) => {
      const objY = objCursor;
      objPos.push({
        id: obj.id,
        x: col3X,
        y: objY,
        w: OBJ_W,
        h: OH,
        data: obj,
        parentId: course.id,
      });

      let aY = objY;
      obj.assessments.forEach((ass) => {
        assPos.push({
          id: ass.id,
          x: col4X,
          y: aY,
          w: ASS_W,
          h: AH,
          data: ass,
          parentId: obj.id,
        });
        aY += AH + AGAP;
      });

      objCursor = Math.max(objCursor + OH + OGAP, aY + OGAP);
    });

    const courseH = Math.max(CH, objCursor - courseStartY);
    coursePos.push({
      id: course.id,
      x: col2X,
      y: courseStartY,
      w: CRS_W,
      h: courseH,
      data: course,
      parentId: indicator.id,
    });
    baseY = courseStartY + courseH + CGAP;
  });

  const maxY =
    Math.max(
      ...indPos.map((p) => p.y + p.h),
      ...coursePos.map((p) => p.y + p.h),
      ...objPos.map((p) => p.y + p.h),
      ...assPos.map((p) => p.y + p.h),
    ) + PAD.top;

  const svgH = Math.max(containerH, maxY + 24);
  svg.attr("width", totalW).attr("height", svgH);

  // ── Gradients ────────────────────────────────────────────────────────────
  const defs = svg.append("defs");

  function linGrad(
    id: string,
    c1: string,
    c2: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    const g = defs
      .append("linearGradient")
      .attr("id", id)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2);
    g.append("stop").attr("offset", "0%").attr("stop-color", c1);
    g.append("stop").attr("offset", "100%").attr("stop-color", c2);
  }

  // Pre-create named card gradients
  const indGrad = defs
    .append("linearGradient")
    .attr("id", "indSel")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  indGrad
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#7c3aed");
  indGrad
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4f46e5");

  // ── Connection drawing ────────────────────────────────────────────────────
  const connLayer = svg.append("g");
  let delay = 0;

  function conn(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sw: number,
    gradId: string,
  ) {
    const mid = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;

    // Thick band (animated draw-in, semi-transparent gradient)
    const band = connLayer
      .append("path")
      .attr("d", d)
      .attr("stroke", `url(#${gradId})`)
      .attr("stroke-width", sw)
      .attr("stroke-linecap", "round")
      .attr("fill", "none")
      .attr("opacity", 0);

    const bLen = (band.node() as SVGPathElement).getTotalLength();
    band
      .attr("stroke-dasharray", `${bLen} ${bLen}`)
      .attr("stroke-dashoffset", bLen)
      .transition()
      .duration(700)
      .delay(delay)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0)
      .attr("opacity", 0.3)
      .on("end", function () {
        d3.select(this).attr("stroke-dasharray", null);
      });

    delay += 60;
  }

  // Level 1: indicator → courses  (40 px band)
  indicator.courses.forEach((course) => {
    const src = indPos.find((p) => p.id === indicator.id)!;
    const tgt = coursePos.find((p) => p.id === course.id)!;
    linGrad(
      `g1-${course.id}`,
      "#7c3aed",
      "#4f46e5",
      src.x + src.w,
      src.y,
      tgt.x,
      tgt.y,
    );
    conn(
      src.x + src.w,
      src.y + src.h / 2,
      tgt.x,
      tgt.y + tgt.h / 2,
      40,
      `g1-${course.id}`,
    );
  });

  // Level 2: courses → objectives  (20 px band)
  objPos.forEach((op) => {
    const cp = coursePos.find((p) => p.id === op.parentId)!;
    if (!cp) return;
    linGrad(
      `g2-${op.id}`,
      "#4f46e5",
      "#0891b2",
      cp.x + cp.w,
      cp.y,
      op.x,
      op.y,
    );
    conn(
      cp.x + cp.w,
      cp.y + cp.h / 2,
      op.x,
      op.y + op.h / 2,
      20,
      `g2-${op.id}`,
    );
  });

  // Level 3: objectives → assessments  (10 px band)
  assPos.forEach((ap) => {
    const op = objPos.find((p) => p.id === ap.parentId)!;
    if (!op) return;
    linGrad(
      `g3-${ap.id}`,
      "#0891b2",
      "#059669",
      op.x + op.w,
      op.y,
      ap.x,
      ap.y,
    );
    conn(
      op.x + op.w,
      op.y + op.h / 2,
      ap.x,
      ap.y + ap.h / 2,
      10,
      `g3-${ap.id}`,
    );
  });

  // ── Cards layer ───────────────────────────────────────────────────────────
  const cards = svg.append("g");

  // ─ Column 1: all indicators ─
  indPos.forEach((p) => {
    const isSel = p.id === indicator.id;
    const g = cards
      .append("g")
      .attr("transform", `translate(${p.x},${p.y})`)
      .style("cursor", "pointer");

    // Background
    if (isSel) {
      g.append("rect")
        .attr("width", p.w)
        .attr("height", p.h)
        .attr("rx", 10)
        .attr("fill", "url(#indSel)")
        .style("filter", "drop-shadow(0 4px 10px rgba(109,40,217,.35))");
    } else {
      g.append("rect")
        .attr("width", p.w)
        .attr("height", p.h)
        .attr("rx", 10)
        .attr("fill", "#ede9fe");
    }

    // Index badge
    g.append("rect")
      .attr("x", 8)
      .attr("y", 10)
      .attr("width", 26)
      .attr("height", 18)
      .attr("rx", 5)
      .attr("fill", isSel ? "rgba(255,255,255,.25)" : "#7c3aed");
    g.append("text")
      .attr("x", 21)
      .attr("y", 23)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .text(String(p.data.index).padStart(2, "0"));

    // Name
    const label =
      p.data.name.length > 8 ? p.data.name.slice(0, 8) : p.data.name;
    g.append("text")
      .attr("x", 42)
      .attr("y", 23)
      .attr("fill", isSel ? "white" : "#4c1d95")
      .attr("font-size", 12)
      .attr("font-weight", isSel ? "bold" : "normal")
      .text(label);

    // Achievement big number
    g.append("text")
      .attr("x", p.w - 10)
      .attr("y", 26)
      .attr("text-anchor", "end")
      .attr("fill", isSel ? "white" : achColor(p.data.achievement))
      .attr("font-size", 20)
      .attr("font-weight", "bold")
      .text(`${p.data.achievement}%`);
    g.append("text")
      .attr("x", p.w - 10)
      .attr("y", 42)
      .attr("text-anchor", "end")
      .attr("fill", isSel ? "rgba(255,255,255,.7)" : "#9ca3af")
      .attr("font-size", 10)
      .text("达成度");
  });

  // ─ Column 2: courses ─
  const lvlColor = { H: "#7c3aed", M: "#0891b2", L: "#ef4444" };
  coursePos.forEach((p) => {
    const g = cards
      .append("g")
      .attr("transform", `translate(${p.x},${p.y})`);
    g.append("rect")
      .attr("width", p.w)
      .attr("height", p.h)
      .attr("rx", 10)
      .attr("fill", "#eef2ff")
      .attr("stroke", "#c7d2fe")
      .attr("stroke-width", 1);

    const n = p.data.name;
    const truncName = n.length > 14 ? n.slice(0, 14) + "…" : n;
    g.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "#1e293b")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(truncName);

    // Tags
    const tags = [p.data.semester, p.data.credits, p.data.courseType];
    tags.forEach((t, ti) => {
      const tx = 10 + ti * 68;
      g.append("rect")
        .attr("x", tx)
        .attr("y", 26)
        .attr("width", 62)
        .attr("height", 16)
        .attr("rx", 4)
        .attr("fill", "#c7d2fe");
      g.append("text")
        .attr("x", tx + 31)
        .attr("y", 38)
        .attr("text-anchor", "middle")
        .attr("fill", "#3730a3")
        .attr("font-size", 9)
        .text(t);
    });

    // Achievement
    const ac = p.data.achievement;
    g.append("text")
      .attr("x", p.w - 8)
      .attr("y", 22)
      .attr("text-anchor", "end")
      .attr("fill", achColor(ac))
      .attr("font-size", 18)
      .attr("font-weight", "bold")
      .text(`${ac}%`);
    g.append("text")
      .attr("x", p.w - 8)
      .attr("y", 36)
      .attr("text-anchor", "end")
      .attr("fill", "#9ca3af")
      .attr("font-size", 10)
      .text("课程达成度");

    // Level badge
    const lv = p.data.level as "H" | "M" | "L";
    g.append("rect")
      .attr("x", p.w - 30)
      .attr("y", 44)
      .attr("width", 22)
      .attr("height", 17)
      .attr("rx", 5)
      .attr("fill", lvlColor[lv]);
    g.append("text")
      .attr("x", p.w - 19)
      .attr("y", 56)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .text(lv);

    // Support count badge
    g.append("circle")
      .attr("cx", p.w + 18)
      .attr("cy", p.h / 2)
      .attr("r", 12)
      .attr("fill", "#6366f1");
    g.append("text")
      .attr("x", p.w + 18)
      .attr("y", p.h / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .text("3");
  });

  // ─ Column 3: objectives ─
  objPos.forEach((p) => {
    const g = cards
      .append("g")
      .attr("transform", `translate(${p.x},${p.y})`);
    g.append("rect")
      .attr("width", p.w)
      .attr("height", p.h)
      .attr("rx", 10)
      .attr("fill", "#ecfdf5")
      .attr("stroke", "#a7f3d0")
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", 10)
      .attr("y", 24)
      .attr("fill", "#065f46")
      .attr("font-size", 12)
      .text(p.data.name);

    const ac = p.data.achievement;
    g.append("text")
      .attr("x", p.w - 8)
      .attr("y", 22)
      .attr("text-anchor", "end")
      .attr("fill", achColor(ac))
      .attr("font-size", 18)
      .attr("font-weight", "bold")
      .text(`${ac.toFixed(1)}%`);
    g.append("text")
      .attr("x", p.w - 8)
      .attr("y", 36)
      .attr("text-anchor", "end")
      .attr("fill", "#9ca3af")
      .attr("font-size", 10)
      .text("达成度");

    // Badge
    g.append("circle")
      .attr("cx", p.w + 18)
      .attr("cy", p.h / 2)
      .attr("r", 12)
      .attr("fill", "#0891b2");
    g.append("text")
      .attr("x", p.w + 18)
      .attr("y", p.h / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .text("3");
  });

  // ─ Column 4: assessments ─
  assPos.forEach((p) => {
    const g = cards
      .append("g")
      .attr("transform", `translate(${p.x},${p.y})`);

    const isProcess = p.data.type === "过程考核";
    g.append("rect")
      .attr("width", p.w)
      .attr("height", p.h)
      .attr("rx", 6)
      .attr("fill", isProcess ? "#dbeafe" : "#d1fae5")
      .attr("stroke", isProcess ? "#93c5fd" : "#6ee7b7")
      .attr("stroke-width", 1);

    const ac = p.data.achievement;
    g.append("text")
      .attr("x", 8)
      .attr("y", p.h / 2 + 4)
      .attr("fill", isProcess ? "#1e40af" : "#065f46")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .text(`${ac}%`);

    g.append("text")
      .attr("x", p.w - 8)
      .attr("y", p.h / 2 + 4)
      .attr("text-anchor", "end")
      .attr("fill", isProcess ? "#2563eb" : "#059669")
      .attr("font-size", 10)
      .text(p.data.type);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AchievementAnalysis() {
  const [groupIdx, setGroupIdx] = useState(0);
  const [indicatorIdx, setIndicatorIdx] = useState(0);
  const [wheelOffset, setWheelOffset] = useState(0);
  const [animKey, setAnimKey] = useState(0); // bump to retrigger diagram animation

  const wheelRef = useRef<SVGSVGElement>(null);
  const diagramRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const group = GROUPS[groupIdx];
  const indicator = group.indicators[indicatorIdx];

  // Navigate to indicator and bump animation key
  const selectIndicator = useCallback(
    (id: string) => {
      const idx = group.indicators.findIndex((i) => i.id === id);
      if (idx < 0) return;
      setIndicatorIdx(idx);
      setAnimKey((k) => k + 1);
    },
    [group.indicators],
  );

  // Draw wheel whenever group / selected indicator / offset changes
  useEffect(() => {
    drawWheel(wheelRef.current, group, indicator.id, wheelOffset, selectIndicator);
  }, [group, indicator.id, wheelOffset, selectIndicator]);

  // Draw diagram whenever indicator changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    drawDiagram(diagramRef.current, group, indicator, width, Math.max(height, 400));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, group, indicator.id]);

  // Also redraw on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      drawDiagram(diagramRef.current, group, indicator, width, height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, indicator.id]);

  const maxOffset = Math.max(0, group.indicators.length - 7);

  // Summary statistics
  const totalCourses = group.indicators.reduce(
    (s, i) => s + i.courses.length,
    0,
  );
  const totalObjs = group.indicators.reduce(
    (s, i) => s + i.courses.reduce((s2, c) => s2 + c.objectives.length, 0),
    0,
  );

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "#f8f7ff" }}
    >
      {/* ── Page header ── */}
      <div className="px-6 py-3 bg-white border-b flex items-center gap-2.5 shrink-0">
        <div className="w-3 h-3 rounded-full border-2 border-indigo-500" />
        <h2 className="text-base font-semibold text-gray-800 tracking-tight">
          单项指标点达成度分析
        </h2>
      </div>

      {/* ── Column titles ── */}
      <div
        className="grid border-b bg-white shrink-0 text-xs font-semibold text-gray-500 text-center"
        style={{ gridTemplateColumns: "300px 1fr 1fr 1fr 1fr" }}
      >
        <div className="py-2.5 border-r text-center">毕业要求</div>
        <div className="py-2.5 border-r">毕业要求指标点</div>
        <div className="py-2.5 border-r">支撑课程</div>
        <div className="py-2.5 border-r">课程目标</div>
        <div className="py-2.5">课程考核</div>
      </div>

      {/* ── Main body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: semi-circle panel ── */}
        <div
          className="shrink-0 flex flex-col items-center bg-white border-r overflow-y-auto"
          style={{ width: 300 }}
        >
          {/* Group selector */}
          <div className="w-full px-4 pt-4 pb-2">
            <select
              value={groupIdx}
              onChange={(e) => {
                const gi = Number(e.target.value);
                setGroupIdx(gi);
                setIndicatorIdx(0);
                setWheelOffset(0);
                setAnimKey((k) => k + 1);
              }}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none w-40 text-gray-700"
            >
              {GROUPS.map((g, i) => (
                <option key={g.id} value={i}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scroll up */}
          <button
            onClick={() => setWheelOffset((p) => Math.max(0, p - 1))}
            disabled={wheelOffset === 0}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* D3 wheel */}
          <svg ref={wheelRef} width={300} height={360} />

          {/* Scroll down */}
          <button
            onClick={() =>
              setWheelOffset((p) => Math.min(maxOffset, p + 1))
            }
            disabled={wheelOffset >= maxOffset}
            className="mb-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Statistics */}
          <div className="mt-auto w-full px-5 pb-5 space-y-2">
            <div className="h-px bg-gray-100" />
            {[
              {
                label: "毕业要求指标点数量",
                value: group.indicators.length,
              },
              { label: "支撑毕业要求课程数量", value: totalCourses },
              { label: "支撑指标点课程目标总数", value: totalObjs },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-base font-bold text-indigo-600">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: connection diagram ── */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-white/60">
          <svg ref={diagramRef} className="block" />
        </div>
      </div>
    </div>
  );
}
