import { useState, useCallback } from 'react';
import { RefreshCw, ArrowRight, Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface AlpacaFormat {
  instruction: string;
  input: string;
  output: string;
}

interface OpenAIFormat {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export function FormatConverter() {
  const [inputFormat, setInputFormat] = useState<'alpaca' | 'openai'>('alpaca');
  const [outputFormat, setOutputFormat] = useState<'alpaca' | 'openai'>(
    'openai'
  );
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [error, setError] = useState('');

  const convertAlpacaToOpenAI = useCallback(
    (data: AlpacaFormat[]): OpenAIFormat[] => {
      return data.map((item) => ({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: item.input
              ? `${item.instruction}\n\n${item.input}`
              : item.instruction,
          },
          {
            role: 'assistant',
            content: item.output,
          },
        ],
      }));
    },
    []
  );

  const convertOpenAIToAlpaca = useCallback(
    (data: OpenAIFormat[]): AlpacaFormat[] => {
      return data.map((item) => {
        const userMessage = item.messages.find((m) => m.role === 'user');
        const assistantMessage = item.messages.find(
          (m) => m.role === 'assistant'
        );

        if (!userMessage || !assistantMessage) {
          throw new Error('Invalid OpenAI format: missing user or assistant message');
        }

        const parts = userMessage.content.split('\n\n');
        const instruction = parts[0];
        const input = parts.slice(1).join('\n\n');

        return {
          instruction,
          input,
          output: assistantMessage.content,
        };
      });
    },
    []
  );

  const handleConvert = useCallback(() => {
    setError('');
    setOutputData('');

    try {
      const parsed = JSON.parse(inputData);

      if (inputFormat === 'alpaca' && outputFormat === 'openai') {
        const result = convertAlpacaToOpenAI(parsed);
        setOutputData(JSON.stringify(result, null, 2));
      } else if (inputFormat === 'openai' && outputFormat === 'alpaca') {
        const result = convertOpenAIToAlpaca(parsed);
        setOutputData(JSON.stringify(result, null, 2));
      } else {
        setOutputData(inputData);
      }
    } catch (err) {
      setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [inputData, inputFormat, outputFormat, convertAlpacaToOpenAI, convertOpenAIToAlpaca]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      setInputData(text);
    },
    []
  );

  const handleDownload = useCallback(() => {
    const blob = new Blob([outputData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-data.${outputFormat}.json`;
    a.click();
  }, [outputData, outputFormat]);

  const swapFormats = useCallback(() => {
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);
    setInputData(outputData);
    setOutputData(inputData);
  }, [inputFormat, outputFormat, inputData, outputData]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            格式转换工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Alpaca ↔ OpenAI 双向转换
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                输入格式: {inputFormat.toUpperCase()}
              </h2>
              <Button variant="text" size="small" className="relative">
                <Upload size={18} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            <textarea
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder={`输入 ${inputFormat.toUpperCase()} 格式的 JSON 数据...`}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            />
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg font-medium">{inputFormat.toUpperCase()}</span>
              <Button
                variant="outlined"
                onClick={swapFormats}
                icon={<RefreshCw size={18} />}
              >
                交换格式
              </Button>
              <span className="text-lg font-medium">{outputFormat.toUpperCase()}</span>
            </div>

            <Button
              variant="filled"
              onClick={handleConvert}
              disabled={!inputData.trim()}
              className="w-full"
              icon={<ArrowRight size={18} />}
            >
              开始转换
            </Button>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                输出格式: {outputFormat.toUpperCase()}
              </h2>
              {outputData && (
                <Button
                  variant="tonal"
                  onClick={handleDownload}
                  icon={<Download size={18} />}
                >
                  下载结果
                </Button>
              )}
            </div>

            <textarea
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm bg-gray-50 dark:bg-gray-900"
              value={outputData}
              readOnly
              placeholder="转换结果将显示在这里..."
            />
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">格式说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Alpaca 格式</h4>
              <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
{`[
  {
    "instruction": "指令文本",
    "input": "输入内容",
    "output": "输出内容"
  }
]`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">OpenAI 格式</h4>
              <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
{`[
  {
    "messages": [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."}
    ]
  }
]`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
