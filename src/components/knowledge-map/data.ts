// ─── Types ────────────────────────────────────────────────────────────────────

export type AbilityGroup = {
  id: string;
  name: string;
  abilities: Ability[];
};

export type Ability = {
  id: string;
  groupId: string;
  name: string;
  isAI?: boolean;
  index: number;
};

export type Course = {
  id: string;
  abilityId: string;
  name: string;
};

export type CourseObjective = {
  id: string;
  courseId: string;
  name: string;
};

export type KnowledgeUnit = {
  id: string;
  objectiveId: string;
  name: string;
};

export type KnowledgePoint = {
  id: string;
  unitId: string;
  name: string;
  isAI?: boolean;
};

// ─── Source vocabulary ────────────────────────────────────────────────────────

const COURSE_NAMES = [
  "电力系统分析",
  "电力系统设计与实践",
  "电路新技术应用",
  "电路设计与仿真",
  "电路实验与实践",
  "电路优化与创新",
];

const OBJECTIVE_NAMES = [
  "电力系统分析",
  "电力系统设计与实践",
  "电路新技术应用",
  "电路设计与仿真",
  "电路实验与实践",
  "电路优化与创新",
];

const UNIT_NAMES = [
  "材料学工艺原理",
  "电路理论基础",
  "电磁场分析方法",
  "系统建模技术",
  "数值计算方法",
  "实验数据处理",
  "工程设计规范",
  "安全防护技术",
  "自动化控制原理",
  "信号处理基础",
];

const POINT_NAMES = [
  "材料学工艺原理",
  "欧姆定律应用分析",
  "基尔霍夫电流定律",
  "基尔霍夫电压定律",
  "叠加定理应用",
  "戴维南等效定理",
  "诺顿等效定理",
  "最大功率传输定理",
  "交流电路相量分析",
  "三相电路计算方法",
];

// ─── Mock data builder ────────────────────────────────────────────────────────

function buildMockData() {
  const abilityGroups: AbilityGroup[] = [
    {
      id: "g1",
      name: "1. 电力基础知识",
      abilities: [
        {
          id: "a1",
          groupId: "g1",
          name: "掌握基本电路定律",
          isAI: false,
          index: 1,
        },
        { id: "a2", groupId: "g1", name: "子能力名称", isAI: true, index: 2 },
        {
          id: "a3",
          groupId: "g1",
          name: "掌握基本电路定律",
          isAI: true,
          index: 3,
        },
        { id: "a4", groupId: "g1", name: "子能力名称", isAI: false, index: 4 },
        {
          id: "a5",
          groupId: "g1",
          name: "掌握基本电路定律",
          isAI: false,
          index: 5,
        },
        { id: "a6", groupId: "g1", name: "子能力名称", isAI: false, index: 6 },
        {
          id: "a7",
          groupId: "g1",
          name: "掌握基本电路定律",
          isAI: false,
          index: 7,
        },
      ],
    },
    {
      id: "g2",
      name: "2. 电力系统运行",
      abilities: [
        {
          id: "a8",
          groupId: "g2",
          name: "系统稳定性分析",
          isAI: false,
          index: 8,
        },
        {
          id: "a9",
          groupId: "g2",
          name: "负荷预测与调度",
          isAI: true,
          index: 9,
        },
        {
          id: "a10",
          groupId: "g2",
          name: "继电保护原理",
          isAI: false,
          index: 10,
        },
        {
          id: "a11",
          groupId: "g2",
          name: "智能电网技术",
          isAI: true,
          index: 11,
        },
        {
          id: "a12",
          groupId: "g2",
          name: "电力市场运营",
          isAI: false,
          index: 12,
        },
      ],
    },
    {
      id: "g3",
      name: "3. 电力设备维护",
      abilities: [
        {
          id: "a13",
          groupId: "g3",
          name: "变压器检修规程",
          isAI: false,
          index: 13,
        },
        {
          id: "a14",
          groupId: "g3",
          name: "开关设备维护",
          isAI: true,
          index: 14,
        },
        {
          id: "a15",
          groupId: "g3",
          name: "电缆线路检测",
          isAI: false,
          index: 15,
        },
        {
          id: "a16",
          groupId: "g3",
          name: "发电机组维护",
          isAI: false,
          index: 16,
        },
      ],
    },
  ];

  const courses: Course[] = [];
  const objectives: CourseObjective[] = [];
  const units: KnowledgeUnit[] = [];
  const points: KnowledgePoint[] = [];

  for (const group of abilityGroups) {
    for (const ability of group.abilities) {
      for (let i = 0; i < 6; i++) {
        const cId = `c-${ability.id}-${i}`;
        courses.push({ id: cId, abilityId: ability.id, name: COURSE_NAMES[i] });

        for (let j = 0; j < 6; j++) {
          const oId = `o-${cId}-${j}`;
          objectives.push({ id: oId, courseId: cId, name: OBJECTIVE_NAMES[j] });

          for (let k = 0; k < 10; k++) {
            const uId = `u-${oId}-${k}`;
            units.push({ id: uId, objectiveId: oId, name: UNIT_NAMES[k] });

            for (let l = 0; l < 10; l++) {
              points.push({
                id: `p-${uId}-${l}`,
                unitId: uId,
                name: POINT_NAMES[l],
                isAI: (k + l) % 7 === 0,
              });
            }
          }
        }
      }
    }
  }

  return { abilityGroups, courses, objectives, units, points };
}

export const mockData = buildMockData();

// ─── O(1) lookup maps ─────────────────────────────────────────────────────────

export const coursesByAbility = new Map<string, Course[]>();
export const objectivesByCourse = new Map<string, CourseObjective[]>();
export const unitsByObjective = new Map<string, KnowledgeUnit[]>();
export const pointsByUnit = new Map<string, KnowledgePoint[]>();
export const pointsById = new Map<string, KnowledgePoint>();
export const unitById = new Map<string, KnowledgeUnit>();

for (const c of mockData.courses) {
  const arr = coursesByAbility.get(c.abilityId) ?? [];
  arr.push(c);
  coursesByAbility.set(c.abilityId, arr);
}
for (const o of mockData.objectives) {
  const arr = objectivesByCourse.get(o.courseId) ?? [];
  arr.push(o);
  objectivesByCourse.set(o.courseId, arr);
}
for (const u of mockData.units) {
  const arr = unitsByObjective.get(u.objectiveId) ?? [];
  arr.push(u);
  unitsByObjective.set(u.objectiveId, arr);
}
for (const p of mockData.points) {
  const arr = pointsByUnit.get(p.unitId) ?? [];
  arr.push(p);
  pointsByUnit.set(p.unitId, arr);
  pointsById.set(p.id, p);
}
for (const u of mockData.units) {
  unitById.set(u.id, u);
}
