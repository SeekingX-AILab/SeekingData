import { useState, useCallback } from 'react';
import { Layers, Play, Pause, RotateCcw, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface BatchItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  data?: {
    instruction: string;
    input: string;
    output: string;
  };
}

export function BatchProcessor() {
  const [urls, setUrls] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<number>(0);

  const startBatchProcess = useCallback(async () => {
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url);

    if (urlList.length === 0) return;

    const items: BatchItem[] = urlList.map((url, index) => ({
      id: `batch-${index}`,
      url,
      status: 'pending',
    }));

    setBatchItems(items);
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      setCurrentItem(i);
      setBatchItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        )
      );

      try {
        const response = await fetch('/api/sft/batch-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: items[i].url }),
        });
        const data = await response.json();

        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'success', data: data.item } : item
          )
        );
      } catch (error) {
        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'error', error: String(error) }
              : item
          )
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
  }, [urls]);

  const retryFailed = useCallback(async () => {
    const failedItems = batchItems.filter((item) => item.status === 'error');
    if (failedItems.length === 0) return;

    for (const failedItem of failedItems) {
      const index = batchItems.findIndex((item) => item.id === failedItem.id);
      setCurrentItem(index);

      setBatchItems((prev) =>
        prev.map((item) =>
          item.id === failedItem.id ? { ...item, status: 'processing' } : item
        )
      );

      try {
        const response = await fetch('/api/sft/batch-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: failedItem.url }),
        });
        const data = await response.json();

        setBatchItems((prev) =>
          prev.map((item) =>
            item.id === failedItem.id
              ? { ...item, status: 'success', data: data.item }
              : item
          )
        );
      } catch (error) {
        setBatchItems((prev) =>
          prev.map((item) =>
            item.id === failedItem.id
              ? { ...item, status: 'error', error: String(error) }
              : item
          )
        );
      }
    }
  }, [batchItems]);

  const exportData = useCallback(() => {
    const successData = batchItems
      .filter((item) => item.status === 'success' && item.data)
      .map((item) => item.data);

    const blob = new Blob([JSON.stringify(successData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sft-batch-data.json';
    a.click();
  }, [batchItems]);

  const progress =
    batchItems.length > 0
      ? (batchItems.filter((item) => item.status !== 'pending').length /
          batchItems.length) *
        100
      : 0;

  const successCount = batchItems.filter(
    (item) => item.status === 'success'
  ).length;
  const errorCount = batchItems.filter(
    (item) => item.status === 'error'
  ).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            批量处理模式
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            批量 URL 处理 - 高效生成训练数据
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">URL 列表</h2>
            <textarea
              className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 mb-4"
              placeholder="每行一个 URL，例如：&#10;https://example.com/article1&#10;https://example.com/article2"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              disabled={isProcessing}
            />

            <div className="flex gap-3">
              <Button
                variant="filled"
                onClick={startBatchProcess}
                disabled={isProcessing || !urls.trim()}
                icon={isProcessing ? <Pause size={18} /> : <Play size={18} />}
              >
                {isProcessing ? '处理中...' : '开始处理'}
              </Button>
              {errorCount > 0 && (
                <Button
                  variant="outlined"
                  onClick={retryFailed}
                  disabled={isProcessing}
                  icon={<RotateCcw size={18} />}
                >
                  重试失败 ({errorCount})
                </Button>
              )}
              {successCount > 0 && (
                <Button
                  variant="tonal"
                  onClick={exportData}
                  icon={<Download size={18} />}
                >
                  导出数据 ({successCount})
                </Button>
              )}
            </div>
          </Card>

          {batchItems.length > 0 && (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">处理进度</h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-green-600">成功: {successCount}</span>
                  <span className="text-red-600">失败: {errorCount}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    总计: {batchItems.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {batchItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      item.status === 'processing'
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : item.status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : item.status === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        item.status === 'processing'
                          ? 'bg-blue-600 text-white'
                          : item.status === 'success'
                            ? 'bg-green-600 text-white'
                            : item.status === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.url}</p>
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.error}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium capitalize">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
