import { useState } from 'react';
import HuggingFaceUploader from './HuggingFaceUploader';

function BatchProcessor({ config, generateAIResponse }) {
  const [urls, setUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [generatedData, setGeneratedData] = useState([]);

  const handleUrlsChange = (e) => {
    setUrls(e.target.value);
  };

  const processUrls = async () => {
    const urlList = urls.split('\n').filter(url => url.trim());
    
    if (urlList.length === 0) {
      setError('请输入至少一个URL');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setGeneratedData([]);
    setError(null);

    try {
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i].trim();
        setProgress(Math.round(((i + 1) / urlList.length) * 100));
        
        try {
          const jinaUrl = `https://r.jina.ai/${url}`;
          const response = await fetch(jinaUrl);
          if (!response.ok) {
            throw new Error(`获取文章内容失败: ${response.status}`);
          }
          
          const content = await response.text();
          
          try {
            const aiResponse = await generateAIResponse(content);
            
            setResults(prev => [...prev, {
              url,
              status: 'success',
              content,
              aiData: aiResponse,
              timestamp: new Date().toISOString()
            }]);

            if (Array.isArray(aiResponse)) {
              setGeneratedData(prev => [...prev, ...aiResponse]);
            }
          } catch (aiError) {
            setResults(prev => [...prev, {
              url,
              status: 'partial',
              content,
              error: `内容提取成功，但AI处理失败: ${aiError.message}`,
              timestamp: new Date().toISOString()
            }]);
          }
          
        } catch (err) {
          setResults(prev => [...prev, {
            url,
            status: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
          }]);
        }
      }
    } catch (err) {
      setError(`批量处理失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTrainingData = () => {
    const blob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          批量URL自动合成数据模式：捕获月球多模态合成数据平台
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入URL列表 (每行一个):
          </label>
          <textarea
            value={urls}
            onChange={handleUrlsChange}
            className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/article1&#10;https://example.com/article2&#10;https://example.com/article3"
          />
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={processUrls}
            disabled={isProcessing || !urls.trim()}
            className={`flex-1 px-6 py-3 text-white font-medium rounded-md transition-colors ${
              isProcessing || !urls.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? '处理中...' : '开始处理'}
          </button>

          <button
            onClick={downloadResults}
            disabled={results.length === 0}
            className={`px-6 py-3 text-white font-medium rounded-md transition-colors ${
              results.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            下载原始结果
          </button>

          <button
            onClick={downloadTrainingData}
            disabled={generatedData.length === 0}
            className={`px-6 py-3 text-white font-medium rounded-md transition-colors ${
              generatedData.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            下载训练数据 ({generatedData.length}条)
          </button>
        </div>

        {isProcessing && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">
              处理进度: {progress}%
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">处理结果:</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md ${
                    result.status === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : result.status === 'partial'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{result.url}</span>
                    <span className={`text-sm ${
                      result.status === 'success'
                        ? 'text-green-600'
                        : result.status === 'partial'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  {result.status === 'success' ? (
                    <div>
                      <div className="text-sm text-gray-600">
                        成功提取内容 ({result.content.length} 字符)
                      </div>
                      <div className="text-sm text-green-600">
                        已生成 {result.aiData?.length || 0} 条训练数据
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      {result.error}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatedData.length > 0 && (
          <HuggingFaceUploader 
            data={generatedData}
            fileName={`training-data-${new Date().toISOString().slice(0, 10)}.json`}
          />
        )}
      </div>
    </div>
  );
}

export default BatchProcessor; 