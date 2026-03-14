import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  FileText,
  Layers,
  RefreshCw,
  Brain,
  Image,
  Video,
  Share2,
  Github,
  Hammer,
  FolderOpen,
  Settings as SettingsIcon,
} from 'lucide-react';

const navItems = [
  {
    category: 'SFT Data Generation',
    items: [
      { path: '/sft/single', label: 'Single Processing', icon: FileText },
      { path: '/sft/batch', label: 'Batch Processing', icon: Layers },
      { path: '/sft/convert', label: 'Format Conversion', icon: RefreshCw },
      { path: '/sft/cot', label: 'CoT Generator', icon: Brain },
      { path: '/sft/image', label: 'Image Dataset', icon: Image },
      { path: '/sft/video', label: 'Video Dataset', icon: Video },
      { path: '/sft/share', label: 'Dataset Share', icon: Share2 },
    ],
  },
  {
    category: 'Harbor Tasks',
    items: [
      { path: '/harbor/github', label: 'GitHub Generator', icon: Github },
      { path: '/harbor/builder', label: 'Visual Builder', icon: Hammer },
      { path: '/harbor/tasks', label: 'Task Manager', icon: FolderOpen },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface border-r border-outline-variant h-full flex flex-col">
      <div className="p-4 border-b border-outline-variant">
        <h1 className="text-xl font-semibold text-primary-600">
          SeekingData
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((section) => (
          <div key={section.category} className="mb-4">
            <h2 className="px-3 py-2 text-xs font-semibold text-on-surface/50 uppercase tracking-wider">
              {section.category}
            </h2>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-on-surface/70 hover:bg-surface-variant'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Pinned Settings link at sidebar bottom */}
      <div className="border-t border-outline-variant p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-on-surface/70 hover:bg-surface-variant'
            )
          }
        >
          <SettingsIcon className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
