import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DatasetShare = () => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'image', 'video', 'cot'

  // 模拟数据集列表
  // 实际应用中应该从后端API获取
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        // 模拟API调用
        const mockDatasets = [
          {
            id: 1,
            title: "通用对话数据集示例",
            description: "包含100条高质量的中文对话数据，适用于对话模型训练。",
            type: "dialogue",
            size: "1.2MB",
            count: 100,
            author: "正经人王同学",
            createDate: "2024-03-15",
            downloads: 156,
            tags: ["对话", "中文", "通用"],
            url: "https://huggingface.co/datasets/example/dialogue-dataset"
          },
          {
            id: 2,
            title: "图像理解数据集示例",
            description: "包含500张图片的多模态问答数据集，适用于视觉语言模型训练。",
            type: "image",
            size: "50MB",
            count: 500,
            author: "正经人王同学",
            createDate: "2024-03-14",
            downloads: 89,
            tags: ["图像", "多模态", "问答"],
            url: "https://huggingface.co/datasets/example/image-dataset"
          },
          {
            id: 3,
            title: "视频理解数据集示例",
            description: "包含200个短视频的多模态问答数据集，适用于视频理解模型训练。",
            type: "video",
            size: "500MB",
            count: 200,
            author: "正经人王同学",
            createDate: "2024-03-13",
            downloads: 45,
            tags: ["视频", "多模态", "问答"],
            url: "https://huggingface.co/datasets/example/video-dataset"
          },
          {
            id: 4,
            title: "CoT推理数据集示例",
            description: "包含300条思维链推理数据，适用于大模型CoT训练。",
            type: "cot",
            size: "2.5MB",
            count: 300,
            author: "正经人王同学",
            createDate: "2024-03-12",
            downloads: 234,
            tags: ["CoT", "推理", "思维链"],
            url: "https://huggingface.co/datasets/example/cot-dataset"
          }
        ];

        setDatasets(mockDatasets);
        setIsLoading(false);
      } catch (err) {
        setError('加载数据集失败');
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  // 过滤和搜索数据集
  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || dataset.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  // 获取数据集类型的图标
  const getTypeIcon = (type) => {
    switch (type) {
      case 'dialogue':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'cot':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          数据集分享平台
        </h1>

        {/* 搜索和筛选区域 */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索数据集..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">所有类型</option>
            <option value="dialogue">对话数据集</option>
            <option value="image">图像数据集</option>
            <option value="video">视频数据集</option>
            <option value="cot">CoT数据集</option>
          </select>
        </div>

        {/* 数据集列表 */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((dataset) => (
              <div key={dataset.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-blue-500">
                        {getTypeIcon(dataset.type)}
                      </span>
                      <h3 className="text-xl font-semibold ml-2">{dataset.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{dataset.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dataset.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                    <div>数据量: {dataset.count}条</div>
                    <div>大小: {dataset.size}</div>
                    <div>作者: {dataset.author}</div>
                    <div>下载: {dataset.downloads}次</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      发布于 {dataset.createDate}
                    </span>
                    <a
                      href={dataset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      查看详情
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页区域 - 可以根据需要添加 */}
        <div className="mt-8 flex justify-center">
          {/* 分页组件 */}
        </div>
      </div>
    </div>
  );
};

export default DatasetShare; 