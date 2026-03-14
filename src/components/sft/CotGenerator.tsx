import { useState, useCallback } from 'react';
import { Brain, Sparkles, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface CoTStep {
  step: number;
  thought: string;
}

interface CoTData {
  id: string;
  question: string;
  reasoning_steps: CoTStep[];
  answer: string;
}

export function CotGenerator() {
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cotData, setCotData] = useState<CoTData | null>(null);
  const [savedItems, setSavedItems] = useState<CoTData[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!question.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/sft/cot-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setCotData(data);
    } catch (error) {
      console.error('CoT generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [question]);

  const handleEditStep = useCallback((stepIndex: number, value: string) => {
    if (!cotData) return;
    setCotData({
      ...cotData,
      reasoning_steps: cotData.reasoning_steps.map((step, idx) =>
        idx === stepIndex ? { ...step, thought: value } : step
      ),
    });
  }, [cotData]);

  const handleAddStep = useCallback(() => {
    if (!cotData) return;
    setCotData({
      ...cotData,
      reasoning_steps: [
        ...cotData.reasoning_steps,
        { step: cotData.reasoning_steps.length + 1, thought: '' },
      ],
    });
  }, [cotData]);

  const handleRemoveStep = useCallback((stepIndex: number) => {
    if (!cotData) return;
    setCotData({
      ...cotData,
      reasoning_steps: cotData.reasoning_steps
        .filter((_, idx) => idx !== stepIndex)
        .map((step, idx) => ({ ...step, step: idx + 1 })),
    });
  }, [cotData]);

  const handleSave = useCallback(() => {
    if (!cotData) return;
    setSavedItems([...savedItems, cotData]);
    localStorage.setItem('cot-data', JSON.stringify([...savedItems, cotData]));
    setCotData(null);
    setQuestion('');
  }, [cotData, savedItems]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            CoT 数据生成器
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chain of Thought 推理数据生成
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold">问题输入</h2>
            </div>

            <textarea
              className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 mb-4"
              placeholder="输入需要推理的问题...&#10;&#10;例如: 小明有5个苹果,他给了小红2个,又买了3个,请问他现在有几个苹果?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <Button
              variant="filled"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!question.trim()}
              className="w-full"
              icon={<Sparkles size={18} />}
            >
              生成推理链
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">推理结果</h2>
              {cotData && (
                <Button
                  variant="tonal"
                  onClick={handleSave}
                  icon={<Save size={18} />}
                >
                  保存数据
                </Button>
              )}
            </div>

            {!cotData ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Brain size={64} className="mx-auto mb-4 opacity-50" />
                <p>输入问题并生成推理链</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">问题</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {cotData.question}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">推理步骤</h3>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleAddStep}
                      icon={<Plus size={16} />}
                    >
                      添加步骤
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {cotData.reasoning_steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                          {step.step}
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-800"
                            rows={2}
                            value={step.thought}
                            onChange={(e) => handleEditStep(index, e.target.value)}
                          />
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleRemoveStep(index)}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                            icon={<Trash2 size={16} />}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">最终答案</h3>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-800"
                    rows={2}
                    value={cotData.answer}
                    onChange={(e) => setCotData({ ...cotData, answer: e.target.value })}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {savedItems.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">
              已保存数据 ({savedItems.length})
            </h2>
            <div className="space-y-3">
              {savedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      数据 #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.reasoning_steps.length} 个推理步骤
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.question}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
