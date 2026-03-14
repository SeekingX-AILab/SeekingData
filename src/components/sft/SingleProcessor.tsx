import { useState, useCallback } from 'react';
import { FileText, Link, Upload, Sparkles, Edit3, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface DataItem {
  id: string;
  instruction: string;
  input: string;
  output: string;
  source: 'file' | 'url' | 'manual';
  timestamp: number;
}

/** Progress state emitted by the SSE stream. */
interface StreamProgress {
  round: number;
  totalRounds: number;
  itemsSoFar: number;
  target: number;
}

export function SingleProcessor() {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'manual'>('file');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [instruction, setInstruction] = useState('');
  const [suggestionsCount, setSuggestionsCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<DataItem[]>([]);
  const [progress, setProgress] = useState<StreamProgress | null>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/sft/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    },
    []
  );

  const handleUrlExtract = useCallback(async () => {
    if (!url.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/sft/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      console.error('URL extraction failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [url]);

  /**
   * Generate SFT data via SSE streaming endpoint.
   *
   * Reads the event stream line by line, updating
   * progress and appending items as they arrive.
   */
  const handleGenerate = useCallback(async () => {
    if (!content.trim() || !instruction.trim()) return;

    setIsGenerating(true);
    setGeneratedData([]);
    setProgress(null);

    try {
      const response = await fetch(
        '/api/sft/generate-stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            instruction,
            suggestions_count: suggestionsCount,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(
              trimmed.slice(6)
            );

            if (event.type === 'progress') {
              setProgress({
                round: event.round,
                totalRounds: event.total_rounds,
                itemsSoFar: event.items_so_far,
                target: event.target,
              });
            } else if (event.type === 'items') {
              setGeneratedData((prev) => [
                ...prev,
                ...event.new_items.map(
                  (item: Record<string, string>) => ({
                    id: crypto.randomUUID(),
                    instruction: item.instruction || '',
                    input: item.input || '',
                    output: item.output || '',
                    source: 'manual' as const,
                    timestamp: Date.now(),
                  })
                ),
              ]);
            } else if (event.type === 'done') {
              setGeneratedData(
                event.items.map(
                  (item: Record<string, string>) => ({
                    id: item.id || crypto.randomUUID(),
                    instruction: item.instruction || '',
                    input: item.input || '',
                    output: item.output || '',
                    source: item.source || 'manual',
                    timestamp: Date.now(),
                  })
                )
              );
              setProgress(null);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  }, [content, instruction, suggestionsCount]);

  const handleEdit = useCallback((id: string, field: string, value: string) => {
    setGeneratedData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem('sft-data', JSON.stringify(generatedData));
  }, [generatedData]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            SFT 数据生成
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            单条处理模式 - 生成高质量的训练数据
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex gap-2 mb-6">
              {[
                { id: 'file', label: '文件上传', icon: Upload },
                { id: 'url', label: 'URL 提取', icon: Link },
                { id: 'manual', label: '手动输入', icon: Edit3 },
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? 'filled' : 'text'}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className="flex items-center gap-2"
                >
                  <Icon size={18} />
                  {label}
                </Button>
              ))}
            </div>

            {activeTab === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">
                      支持 PDF、DOCX、TXT、MD 文件
                    </p>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="space-y-4">
                <Input
                  label="URL 地址"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  variant="filled"
                  onClick={handleUrlExtract}
                  loading={isGenerating}
                  className="w-full"
                >
                  提取内容
                </Button>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-4">
                <textarea
                  className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  placeholder="手动输入内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            )}

            {content && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-2">提取的内容</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {content.slice(0, 200)}...
                  </p>
                </div>

                <Input
                  label="指令（Instruction）"
                  placeholder="请根据以下内容生成训练数据..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">
                    生成数量: {suggestionsCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={suggestionsCount}
                    onChange={(e) => setSuggestionsCount(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>

                <Button
                  variant="filled"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  className="w-full"
                  icon={<Sparkles size={18} />}
                >
                  生成训练数据
                </Button>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        生成中... 第 {progress.round}/{progress.totalRounds} 轮
                      </span>
                      <span>
                        {progress.itemsSoFar}/{progress.target} 条
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (progress.itemsSoFar / progress.target) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">生成结果</h2>
              {generatedData.length > 0 && (
                <Button
                  variant="tonal"
                  onClick={handleSave}
                  icon={<Save size={18} />}
                >
                  保存数据
                </Button>
              )}
            </div>

            {generatedData.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <p>暂无生成数据</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedData.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">
                        数据 #{index + 1}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Instruction
                      </label>
                      <textarea
                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded resize-none dark:bg-gray-700"
                        rows={2}
                        value={item.instruction}
                        onChange={(e) =>
                          handleEdit(item.id, 'instruction', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Input
                      </label>
                      <textarea
                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded resize-none dark:bg-gray-700"
                        rows={2}
                        value={item.input}
                        onChange={(e) =>
                          handleEdit(item.id, 'input', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Output
                      </label>
                      <textarea
                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded resize-none dark:bg-gray-700"
                        rows={4}
                        value={item.output}
                        onChange={(e) =>
                          handleEdit(item.id, 'output', e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
