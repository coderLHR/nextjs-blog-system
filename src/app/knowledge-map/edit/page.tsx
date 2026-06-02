import { EditPage } from "@/components/knowledge-map/EditPage";
import { NavController } from "@/components/knowledge-map/NavController";

export const metadata = { title: "知识点编辑 - NextBlog" };

/**
 * Full-screen edit page — same layout contract as the selector page:
 * `fixed inset-0 z-[100]` covers the viewport; NavController hides the
 * sticky header and reveals it on hover at the top of the screen.
 */
export default function KnowledgeMapEditPage() {
  return (
    <div className="fixed inset-0 z-[100]">
      <NavController />
      <EditPage />
    </div>
  );
}
