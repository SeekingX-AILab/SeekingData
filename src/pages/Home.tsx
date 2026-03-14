import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
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
} from 'lucide-react';

const quickActions = [
  {
    category: 'SFT Data Generation',
    description: 'Generate training data for AI models',
    items: [
      {
        path: '/sft/single',
        label: 'Single Processing',
        icon: FileText,
        color: 'bg-blue-500',
      },
      {
        path: '/sft/batch',
        label: 'Batch Processing',
        icon: Layers,
        color: 'bg-green-500',
      },
      {
        path: '/sft/convert',
        label: 'Format Conversion',
        icon: RefreshCw,
        color: 'bg-purple-500',
      },
      {
        path: '/sft/cot',
        label: 'CoT Generator',
        icon: Brain,
        color: 'bg-orange-500',
      },
      {
        path: '/sft/image',
        label: 'Image Dataset',
        icon: Image,
        color: 'bg-pink-500',
      },
      {
        path: '/sft/video',
        label: 'Video Dataset',
        icon: Video,
        color: 'bg-red-500',
      },
      {
        path: '/sft/share',
        label: 'Dataset Share',
        icon: Share2,
        color: 'bg-cyan-500',
      },
    ],
  },
  {
    category: 'Harbor Tasks',
    description: 'Build and manage Harbor evaluation tasks',
    items: [
      {
        path: '/harbor/github',
        label: 'GitHub Generator',
        icon: Github,
        color: 'bg-gray-700',
      },
      {
        path: '/harbor/builder',
        label: 'Visual Builder',
        icon: Hammer,
        color: 'bg-indigo-500',
      },
      {
        path: '/harbor/tasks',
        label: 'Task Manager',
        icon: FolderOpen,
        color: 'bg-teal-500',
      },
    ],
  },
];

export function Home() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-on-background mb-2">
            Welcome to SeekingData
          </h1>
          <p className="text-on-surface/60">
            Generate AI training data and build Harbor evaluation tasks
          </p>
        </div>

        {quickActions.map((section) => (
          <div key={section.category} className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-on-background mb-1">
                {section.category}
              </h2>
              <p className="text-sm text-on-surface/60">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Card variant="outlined" interactive className="h-full">
                    <Card.Header>
                      <div
                        className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-3`}
                      >
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-medium text-on-surface">{item.label}</h3>
                    </Card.Header>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
