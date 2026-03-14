import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'ready' | 'testing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/harbor/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = useCallback(
    async (taskId: string) => {
      if (!confirm('确定要删除这个任务吗?')) return;

      try {
        await fetch(`/api/harbor/tasks/${taskId}`, { method: 'DELETE' });
        setTasks(tasks.filter((t) => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    },
    [tasks, selectedTask]
  );

  const handleRun = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/harbor/tasks/${taskId}/run`, { method: 'POST' });
      fetchTasks();
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  }, [fetchTasks]);

  const handleExport = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/harbor/tasks/${taskId}/export`);
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-${taskId}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export task:', error);
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'failed':
        return <XCircle className="text-red-600" size={18} />;
      case 'testing':
        return <Clock className="text-blue-600 animate-spin" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300';
      case 'testing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            任务管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理和监控 Harbor 任务
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            >
              <option value="all">所有状态</option>
              <option value="draft">草稿</option>
              <option value="ready">就绪</option>
              <option value="testing">测试中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
            <Button variant="filled" icon={<Plus size={18} />}>
              新建任务
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600">加载中...</p>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card className="p-12 text-center">
                <FolderOpen size={64} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || filterStatus !== 'all'
                    ? '没有找到匹配的任务'
                    : '暂无任务'}
                </p>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTask?.id === task.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {task.id.slice(0, 8)}...</span>
                        <span>
                          创建于:{' '}
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedTask ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">任务详情</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      任务名称
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTask.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      描述
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTask.description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      状态
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedTask.status)}
                      <span className="capitalize">{selectedTask.status}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedTask.status === 'draft' && (
                      <Button
                        variant="filled"
                        onClick={() => handleRun(selectedTask.id)}
                        icon={<Play size={18} />}
                      >
                        运行任务
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => handleExport(selectedTask.id)}
                      icon={<Download size={18} />}
                    >
                      导出
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleDelete(selectedTask.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      icon={<Trash2 size={18} />}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500">选择一个任务查看详情</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
