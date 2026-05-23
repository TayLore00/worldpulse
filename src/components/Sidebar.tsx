import {
  Globe,
  Landmark,
  Swords,
  FlaskConical,
  AlertTriangle,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Category } from "../types/news";

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All News", icon: <Globe className="w-4 h-4" /> },
  { id: "world", label: "World", icon: <Globe className="w-4 h-4" /> },
  { id: "politics", label: "Politics", icon: <Landmark className="w-4 h-4" /> },
  { id: "conflict", label: "Conflict", icon: <Swords className="w-4 h-4" /> },
  { id: "science", label: "Science", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "disaster", label: "Disaster", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "technology", label: "Technology", icon: <Cpu className="w-4 h-4" /> },
];

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-30 bg-gray-900/95 backdrop-blur-md border-r border-gray-800 transition-all duration-300 ease-in-out ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      <div className="flex flex-col h-full pt-4">
        <div className="flex-1 space-y-1 px-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title={collapsed ? cat.label : undefined}
              >
                <span className="flex-shrink-0">{cat.icon}</span>
                {!collapsed && <span className="truncate">{cat.label}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center h-10 border-t border-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
