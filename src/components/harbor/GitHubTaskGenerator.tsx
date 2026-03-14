import { useState, useCallback } from 'react';
import { Github, Link, Sparkles, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface GitHubAnalysis {
  repo_url: string;
  repo_name: string;
  issue_title?: string;
  issue_body?: string;
  pr_title?: string;
  pr_body?: string;
  code_context: Array<{ name: string; type: string; path: string }>;
  suggested_tasks: string[];
}

interface GeneratedTask {
  id: string;
  name: string;
  description: string;
  status: string;
  instruction: string;
}

export function GitHubTaskGenerator() {
  const [repoUrl, setRepoUrl] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(null);
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!repoUrl.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/harbor/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          issue_number: issueNumber ? parseInt(issueNumber) : undefined,
          pr_number: prNumber ? parseInt(prNumber) : undefined,
        }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [repoUrl, issueNumber, prNumber]);

  const handleGenerate = useCallback(async () => {
    if (!repoUrl.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/harbor/github/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          issue_number: issueNumber ? parseInt(issueNumber) : undefined,
          pr_number: prNumber ? parseInt(prNumber) : undefined,
        }),
      });
      const data = await response.json();
      setGeneratedTask(data);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [repoUrl, issueNumber, prNumber]);

  const handleExport = useCallback(async () => {
    if (!generatedTask) return;

    const response = await fetch(`/api/harbor/tasks/${generatedTask.id}/export`);
    const data = await response.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${generatedTask.id}.json`;
    a.click();
  }, [generatedTask]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            GitHub 任务生成
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            从 GitHub 仓库自动生成 Harbor 任务
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Github className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold">仓库信息</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="GitHub 仓库 URL"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Issue 编号（可选）"
                  placeholder="123"
                  type="number"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                />

                <Input
                  label="PR 编号（可选）"
                  placeholder="456"
                  type="number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outlined"
                  onClick={handleAnalyze}
                  loading={isAnalyzing}
                  disabled={!repoUrl.trim()}
                  icon={<Link size={18} />}
                >
                  分析仓库
                </Button>

                <Button
                  variant="filled"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!repoUrl.trim()}
                  icon={<Sparkles size={18} />}
                >
                  生成任务
                </Button>
              </div>
            </div>

            {analysis && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">仓库分析结果</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>名称:</strong> {analysis.repo_name}
                  </p>
                  {analysis.issue_title && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Issue:</strong> {analysis.issue_title}
                    </p>
                  )}
                  {analysis.pr_title && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>PR:</strong> {analysis.pr_title}
                    </p>
                  )}
                  {analysis.code_context.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">代码结构:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.code_context.slice(0, 10).map((item) => (
                          <li key={item.path} className="text-gray-600">
                            {item.type === 'dir' ? '📁' : '📄'} {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {analysis.suggested_tasks.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-medium mb-2">建议任务</h3>
                    <ul className="text-sm space-y-1">
                      {analysis.suggested_tasks.map((task, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-300">
                          • {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">生成的任务</h2>
              {generatedTask && (
                <Button
                  variant="tonal"
                  onClick={handleExport}
                  icon={<Download size={18} />}
                >
                  导出任务
                </Button>
              )}
            </div>

            {!generatedTask ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Github size={64} className="mx-auto mb-4 opacity-50" />
                <p>分析仓库并生成任务</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-2">{generatedTask.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {generatedTask.description}
                  </p>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full">
                    {generatedTask.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium mb-2">任务指令</h3>
                  <textarea
                    className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm dark:bg-gray-800"
                    value={generatedTask.instruction}
                    readOnly
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outlined"
                    onClick={() => setGeneratedTask(null)}
                    icon={<RefreshCw size={18} />}
                  >
                    重新生成
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
