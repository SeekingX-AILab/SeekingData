import { useState, useCallback } from 'react';
import { Hammer, Play, Save, Eye, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export function VisualTaskBuilder() {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [tags, setTags] = useState('');
  const [dockerfile, setDockerfile] = useState('FROM python:3.12-slim\n\nWORKDIR /app\n\nCOPY . .\n\nRUN pip install -r requirements.txt');
  const [testCommand, setTestCommand] = useState('pytest tests/ -v');
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  const handleSave = useCallback(async () => {
    if (!taskName.trim() || !instruction.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/harbor/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          description: taskDescription,
          instruction,
          task_config: {
            name: taskName,
            description: taskDescription,
            difficulty,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          },
          environment_config: {
            environment_type: 'docker',
            setup_commands: [`cat > Dockerfile << 'EOF'\n${dockerfile}\nEOF`],
          },
          agent_config: {
            agent_type: 'claude-code',
            model: 'claude-sonnet-4-20250514',
          },
          verifier_config: {
            test_commands: [testCommand],
          },
          tests: [testCommand],
        }),
      });

      if (response.ok) {
        alert('任务保存成功!');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  }, [taskName, taskDescription, instruction, difficulty, tags, dockerfile, testCommand]);

  const generateTaskToml = useCallback(() => {
    return `[task]
name = "${taskName}"
description = "${taskDescription}"
difficulty = ${difficulty}
tags = [${tags.split(',').map((t) => `"${t.trim()}"`).join(', ')}]

[environment]
type = "docker"
base_image = "python:3.12-slim"

[agent]
type = "claude-code"
model = "claude-sonnet-4-20250514"

[verifier]
test_commands = ["${testCommand}"]
timeout = 300
`;
  }, [taskName, taskDescription, difficulty, tags, testCommand]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            可视化任务构建器
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            通过可视化界面构建 Harbor 任务
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={previewMode === 'edit' ? 'filled' : 'outlined'}
            onClick={() => setPreviewMode('edit')}
            icon={<Hammer size={18} />}
          >
            编辑模式
          </Button>
          <Button
            variant={previewMode === 'preview' ? 'filled' : 'outlined'}
            onClick={() => setPreviewMode('preview')}
            icon={<Eye size={18} />}
          >
            预览模式
          </Button>
        </div>

        {previewMode === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">基本信息</h2>

              <div className="space-y-4">
                <Input
                  label="任务名称"
                  placeholder="my-awesome-task"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    任务描述
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-800"
                    rows={3}
                    placeholder="描述任务的目标和预期结果..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    难度: {difficulty}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Input
                  label="标签（逗号分隔）"
                  placeholder="bugfix, feature, refactor"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">任务指令</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    任务指令（Markdown 格式）
                  </label>
                  <textarea
                    className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm dark:bg-gray-800"
                    placeholder="# 任务描述

请实现以下功能...

## 要求
- 要求 1
- 要求 2

## 验证
运行测试确保代码正确"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">环境配置</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dockerfile
                  </label>
                  <textarea
                    className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm dark:bg-gray-800"
                    value={dockerfile}
                    onChange={(e) => setDockerfile(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">验证配置</h2>

              <div className="space-y-4">
                <Input
                  label="测试命令"
                  placeholder="pytest tests/ -v"
                  value={testCommand}
                  onChange={(e) => setTestCommand(e.target.value)}
                />

                <div className="pt-4">
                  <Button
                    variant="filled"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={!taskName.trim() || !instruction.trim()}
                    icon={<Save size={18} />}
                  >
                    保存任务
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">task.toml 预览</h2>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(generateTaskToml());
                  }}
                  icon={<Code size={16} />}
                >
                  复制
                </Button>
              </div>

              <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto font-mono">
                {generateTaskToml()}
              </pre>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">instruction.md 预览</h2>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(instruction);
                  }}
                  icon={<Code size={16} />}
                >
                  复制
                </Button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap font-mono">{instruction}</pre>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Dockerfile 预览</h2>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(dockerfile);
                  }}
                  icon={<Code size={16} />}
                >
                  复制
                </Button>
              </div>

              <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto font-mono">
                {dockerfile}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
