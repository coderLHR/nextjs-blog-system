import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/lib/actions";
import { ThemeToggle } from "./theme-toggle";
import {
  BookOpen,
  PenTool,
  Home,
  LogIn,
  LogOut,
  User,
  CalendarDays,
  Workflow,
  Network,
  BarChart3,
  Edit,
} from "lucide-react";

export async function Nav() {
  let session: Awaited<ReturnType<typeof getSession>> = null;

  try {
    session = await getSession();
  } catch {
    session = null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-md shadow-primary/20">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span>NextBlog</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {[
              { href: "/", icon: Home, label: "首页" },
              { href: "/blog", icon: PenTool, label: "博客" },
              { href: "/learn", icon: BookOpen, label: "教学" },
              { href: "/schedule", icon: CalendarDays, label: "课程表" },
              { href: "/ability-map", icon: Workflow, label: "能力图谱" },
              { href: "/knowledge-map", icon: Network, label: "知识点关联" },
              { href: "/indicators", icon: BarChart3, label: "达成度分析" },
              { href: "/knowledge-map/edit", icon: Edit, label: "知识点编辑" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground font-medium">
                {session.name || session.email}
              </span>
              <form action={logout}>
                <button type="submit" className="ios-btn ios-btn-secondary">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="ios-btn ios-btn-primary">
              <LogIn className="h-3.5 w-3.5" />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
