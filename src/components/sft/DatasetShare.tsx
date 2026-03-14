import { useState, useCallback } from 'react';
import { Share2, Upload, Download, Link } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export function DatasetShare() {
  const [activeTab, setActiveTab] = useState<'huggingface' | 'local'>(
    'huggingface'
  );
  const [hfToken, setHfToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('repo_name', repoName);
      formData.append('token', hfToken);

      try {
        const response = await fetch('/api/sft/upload-to-hf', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          alert('上传成功!');
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(100);
      }
    },
    [repoName, hfToken]
  );

  const handleExportLocal = useCallback(() => {
    const storedData = localStorage.getItem('sft-data');
    if (!storedData) {
      alert('没有保存的数据');
      return;
    }

    const blob = new Blob([storedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sft-dataset.json';
    a.click();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            数据集分享
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            上传到 HuggingFace 或导出到本地
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'huggingface' ? 'filled' : 'outlined'}
            onClick={() => setActiveTab('huggingface')}
            icon={<Link size={18} />}
          >
            HuggingFace 上传
          </Button>
          <Button
            variant={activeTab === 'local' ? 'filled' : 'outlined'}
            onClick={() => setActiveTab('local')}
            icon={<Download size={18} />}
          >
            本地导出
          </Button>
        </div>

        {activeTab === 'huggingface' ? (
          <Card className="p-6">
            <div className="space-y-4">
              <Input
                label="HuggingFace Token"
                type="password"
                placeholder="hf_xxxxxxxxxxxxxxxxxx"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
              />

              <Input
                label="仓库名称"
                placeholder="your-username/your-dataset"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />

              <div className="pt-4">
                <div className="relative">
                  <Button
                    variant="filled"
                    disabled={!hfToken || !repoName}
                    icon={<Upload size={18} />}
                  >
                    上传数据集
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      上传进度
                    </span>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium mb-2">使用说明</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>1. 在 HuggingFace 获取 Access Token</li>
                  <li>2. 输入仓库名称（格式: username/dataset-name）</li>
                  <li>3. 选择要上传的数据集文件</li>
                  <li>4. 等待上传完成</li>
                </ul>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center py-8">
                <Download size={64} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  导出所有已保存的 SFT 数据到本地
                </p>
                <Button
                  variant="filled"
                  onClick={handleExportLocal}
                  icon={<Download size={18} />}
                >
                  导出数据集
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">导出格式</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  JSON 格式,包含所有保存的训练数据
                </p>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
{`[
  {
    "instruction": "...",
    "input": "...",
    "output": "..."
  }
]`}
                </pre>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
