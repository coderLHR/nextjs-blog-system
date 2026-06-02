import { KnowledgeMapSelector } from "@/components/knowledge-map/KnowledgeMapSelector";
import { NavController } from "@/components/knowledge-map/NavController";

export const metadata = {
  title: "知识点关联 - NextBlog",
  description:
    "五级联动知识点选择器：子能力 → 课程 → 课程目标 → 知识点单元 → 知识点",
};

/**
 * Full-screen page: breaks out of the root layout's padding and nav height.
 *
 * • `fixed inset-0 z-[100]`  – covers the entire viewport, sits above the
 *   sticky nav (z-50) so the nav is visually hidden behind this page.
 * • NavController (client)   – moves the nav to position:fixed z-200 and
 *   hides it with translateY(-100%).  Hovering the top 12px of the viewport
 *   slides the nav back in.  On unmount all styles are restored for other pages.
 */
export default function KnowledgeMapPage() {
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Hover-reveal nav – must render before the selector */}
      <NavController />
      <KnowledgeMapSelector />
    </div>
  );
}
