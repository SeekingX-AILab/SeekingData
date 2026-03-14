import React, { useState, useRef } from 'react';
import { Upload, Copy, Download, FileUp, ArrowLeftRight } from 'lucide-react';

const FormatConverter = () => {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [conversionMode, setConversionMode] = useState('alpaca-to-openai');
  const fileInputRef = useRef(null);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const alpacaToOpenAI = (data) => {
    const alpacaData = Array.isArray(data) ? data : [data];
    
    return alpacaData.map(item => {
      const messages = [];
      
      if (item.system) {
        messages.push({
          role: "system",
          content: item.system
        });
      }
      
      if (item.history && Array.isArray(item.history)) {
        item.history.forEach(([humanMsg, assistantMsg]) => {
          if (humanMsg) {
            messages.push({
              role: "user",
              content: humanMsg
            });
          }
          if (assistantMsg) {
            messages.push({
              role: "assistant",
              content: assistantMsg
            });
          }
        });
      }
      
      const userContent = item.input 
        ? `${item.instruction}\n\n${item.input}` 
        : item.instruction;
      
      messages.push({
        role: "user",
        content: userContent
      });
      
      messages.push({
        role: "assistant",
        content: item.output
      });
      
      return { messages };
    });
  };

  const openAIToAlpaca = (data) => {
    const openaiData = Array.isArray(data) ? data : [data];
    
    return openaiData.map(item => {
      const result = {
        instruction: "",
        input: "",
        output: "",
        history: []
      };
      
      // 处理消息序列
      const messages = item.messages;
      let currentHistoryPair = ["", ""];
      let systemFound = false;
      
      messages.forEach((msg, index) => {
        switch(msg.role) {
          case "system":
            result.system = msg.content;
            systemFound = true;
            break;
            
          case "user":
            // 如果是最后一个user消息，则作为主要instruction
            if (index === messages.length - 2) {
              // 尝试分离instruction和input
              const parts = msg.content.split('\n\n');
              if (parts.length > 1) {
                result.instruction = parts[0];
                result.input = parts.slice(1).join('\n\n');
              } else {
                result.instruction = msg.content;
              }
            } else {
              // 否则作为历史对话
              currentHistoryPair[0] = msg.content;
            }
            break;
            
          case "assistant":
            // 如果是最后一个assistant消息，则作为主要output
            if (index === messages.length - 1) {
              result.output = msg.content;
            } else {
              // 否则作为历史对话
              currentHistoryPair[1] = msg.content;
              result.history.push([...currentHistoryPair]);
              currentHistoryPair = ["", ""];
            }
            break;
        }
      });
      
      // 如果没有system，删除system字段
      if (!systemFound) {
        delete result.system;
      }
      
      // 如果没有历史对话，删除history字段
      if (result.history.length === 0) {
        delete result.history;
      }
      
      // 如果没有input，删除input字段
      if (!result.input) {
        delete result.input;
      }
      
      return result;
    });
  };

  const handleConvert = () => {
    try {
      const inputJson = JSON.parse(inputData);
      const result = conversionMode === 'alpaca-to-openai' 
        ? alpacaToOpenAI(inputJson)
        : openAIToAlpaca(inputJson);
      setOutputData(JSON.stringify(result, null, 2));
      setError('');
    } catch (err) {
      setError('JSON格式错误，请检查输入数据格式是否正确');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputData);
      showSuccess('已复制到剪贴板！');
    } catch (err) {
      setError('复制失败，请手动复制');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setInputData(e.target.result);
        showSuccess('文件上传成功！');
      } catch (err) {
        setError('文件读取失败');
      }
    };
    reader.readAsText(file);
  };

  const handleBatchUpload = (event) => {
    const files = event.target.files;
    if (!files.length) return;

    const results = [];
    let processedFiles = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const converted = conversionMode === 'alpaca-to-openai' 
            ? alpacaToOpenAI(data)
            : openAIToAlpaca(data);
          results.push(...converted);
          
          processedFiles++;
          if (processedFiles === files.length) {
            setOutputData(JSON.stringify(results, null, 2));
            showSuccess(`成功转换 ${files.length} 个文件！`);
          }
        } catch (err) {
          setError(`文件 ${file.name} 处理失败: ${err.message}`);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDownload = () => {
    if (!outputData) {
      setError('没有可下载的数据');
      return;
    }

    const blob = new Blob([outputData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${conversionMode === 'alpaca-to-openai' ? 'openai' : 'alpaca'}_format.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('文件已下载！');
  };

  const handleModeChange = (newMode) => {
    setConversionMode(newMode);
    setInputData('');
    setOutputData('');
    setError('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">数据格式转换器</h2>
        </div>
        
        <div className="p-6">
          {/* 转换模式选择 */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleModeChange('alpaca-to-openai')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                conversionMode === 'alpaca-to-openai'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
            >
              Alpaca 转 OpenAI
            </button>
            <button
              onClick={() => handleModeChange('openai-to-alpaca')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                conversionMode === 'openai-to-alpaca'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
            >
              OpenAI 转 Alpaca
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 输入区域 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium">
                  {conversionMode === 'alpaca-to-openai' ? 'Alpaca 格式输入:' : 'OpenAI 格式输入:'}
                </label>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传单个
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.json';
                      input.onchange = handleBatchUpload;
                      input.click();
                    }}
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    批量上传
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-96 p-2 border rounded-md font-mono text-sm"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder={`请输入${conversionMode === 'alpaca-to-openai' ? 'Alpaca' : 'OpenAI'}格式的JSON数据...`}
              />
            </div>

            {/* 输出区域 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium">
                  {conversionMode === 'alpaca-to-openai' ? 'OpenAI 格式输出:' : 'Alpaca 格式输出:'}
                </label>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </button>
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-96 p-2 border rounded-md font-mono text-sm"
                value={outputData}
                readOnly
                placeholder={`转换后的${conversionMode === 'alpaca-to-openai' ? 'OpenAI' : 'Alpaca'}格式将显示在这里...`}
              />
            </div>
          </div>
          
          {/* 转换按钮 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleConvert}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              转换格式
            </button>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* 成功提示 */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatConverter;