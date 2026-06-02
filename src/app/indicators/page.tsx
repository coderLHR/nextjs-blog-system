import { AchievementAnalysis } from "@/components/indicators/AchievementAnalysis";
import { NavController } from "@/components/knowledge-map/NavController";

export const metadata = {
  title: "指标点达成度分析 - NextBlog",
  description: "单项指标点达成度分析，展示毕业要求指标点与支撑课程的关联及达成情况",
};

export default function IndicatorsPage() {
  return (
    <div className="fixed inset-0 z-[100]">
      <NavController />
      <AchievementAnalysis />
    </div>
  );
}
