import React, { useState, useEffect } from 'react';
import * as hub from '@huggingface/hub';

const HuggingFaceUploader = ({ data, fileName, formatData }) => {
  // 从 localStorage 初始化状态
  const [token, setToken] = useState(() => {
    return localStorage.getItem('hf_token') || '';
  });
  
  const [repoName, setRepoName] = useState(() => {
    return localStorage.getItem('hf_repo_name') || '';
  });
  
  const [repoType, setRepoType] = useState(() => {
    return localStorage.getItem('hf_repo_type') || 'model';
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // 保存设置到 localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('hf_token', token);
    }
  }, [token]);

  useEffect(() => {
    if (repoName) {
      localStorage.setItem('hf_repo_name', repoName);
    }
  }, [repoName]);

  useEffect(() => {
    localStorage.setItem('hf_repo_type', repoType);
  }, [repoType]);

  // 清除设置
  const clearSettings = () => {
    if (window.confirm('确定要清除所有保存的设置吗？')) {
      localStorage.removeItem('hf_token');
      localStorage.removeItem('hf_repo_name');
      localStorage.removeItem('hf_repo_type');
      setToken('');
      setRepoName('');
      setRepoType('model');
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!token || !repoName) {
      setError('请填写 Token 和仓库名称');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // 验证 token
      const { name: username } = await hub.whoAmI({ accessToken: token });
      
      // 构建仓库信息
      const [owner, name] = repoName.split('/');
      if (!owner || !name) {
        throw new Error('仓库名称格式应为: username/repository');
      }

      const repo = { 
        type: repoType, 
        name: repoName
      };

      // 检查仓库访问权限
      try {
        await hub.checkRepoAccess({ repo, accessToken: token });
      } catch (e) {
        // 如果仓库不存在,则创建
        if (e.message.includes('404')) {
          await hub.createRepo({ 
            repo, 
            accessToken: token,
            license: 'mit',
            private: false
          });
        } else {
          throw e;
        }
      }

      // 准备要上传的文件内容
      const formattedData = formatData ? formatData(data) : data;
      const content = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });

      // 上传文件并显示进度
      for await (const progressEvent of hub.uploadFilesWithProgress({
        repo,
        accessToken: token,
        files: [{
          path: `data/${fileName}`,
          content: blob
        }]
      })) {
        if (progressEvent.status === 'progress') {
          setUploadProgress(Math.round(progressEvent.progress * 100));
        }
      }

      setSuccess('文件上传成功！');
    } catch (err) {
      console.error('Upload error:', err);
      setError(`上传失败: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">上传到 Hugging Face</h3>
        <button
          onClick={clearSettings}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          清除保存的设置
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Token:
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="输入你的 Hugging Face Access Token"
          />
          <p className="mt-1 text-sm text-gray-500">
            <a 
              href="https://huggingface.co/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              获取 Access Token
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            仓库名称:
          </label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="格式: username/repository"
          />
          <p className="mt-1 text-sm text-gray-500">
            例如: your-username/your-dataset
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            仓库类型:
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={repoType}
            onChange={(e) => setRepoType(e.target.value)}
          >
            <option value="model">Model</option>
            <option value="dataset">Dataset</option>
          </select>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full py-2 px-4 rounded-md text-white ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isUploading ? '上传中...' : '上传到 Hugging Face'}
        </button>

        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-center mt-1 text-sm text-gray-600">
              上传进度: {uploadProgress}%
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default HuggingFaceUploader; 