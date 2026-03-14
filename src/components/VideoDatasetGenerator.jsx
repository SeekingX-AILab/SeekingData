import React, { useState, useRef } from 'react';
import JSZip from 'jszip';

const VideoDatasetGenerator = ({ config }) => {
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalDataset, setFinalDataset] = useState([]);
  const [renamedVideos, setRenamedVideos] = useState([]);
  const fileInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY_BIGMODEL;

  // Get video path helper function
  const getVideoLocalPath = (videoInfo) => {
    if (videoInfo && videoInfo.newName) {
      return `videos/${videoInfo.newName}`;
    }
    return '';
  };

  // Handle video upload
  const handleVideoUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => 
      file.type.startsWith('video/')
    );

    if (validFiles.length !== files.length) {
      setError('请只上传视频文件');
      return;
    }

    // Process video files
    Promise.all(
      validFiles.map((file, index) => {
        return new Promise((resolve) => {
          const timestamp = Date.now();
          const newFileName = `video_${timestamp}_${index}${getFileExtension(file.name)}`;
          
          // Create video URL for preview
          const videoUrl = URL.createObjectURL(file);
          
          resolve({
            file,
            path: videoUrl,
            originalName: file.name,
            newName: newFileName,
            blob: file // Store the original file for later packaging
          });
        });
      })
    ).then(videos => {
      setUploadedVideos(prev => [...prev, ...videos]);
      setRenamedVideos(prev => [...prev, ...videos]);
      setError('');
    });
  };

  // Helper functions
  const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 1);
  };

  // Generate questions for each video
  const generateQuestions = async () => {
    if (uploadedVideos.length === 0) {
      setError('请先上传视频');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const questions = await Promise.all(
        uploadedVideos.map(async (video) => {
          const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "qwen-vl-max",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "video_url",
                      video_url: {
                        url: video.path
                      }
                    },
                    {
                      type: "text",
                      text: "请基于这个视频生成3个有意义的问题。问题要简洁、明确，并且与视频内容直接相关。"
                    }
                  ]
                }
              ],
              stream: false,
              temperature: 0.8,
              top_p: 0.6,
              max_tokens: 1024
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${errorData.error?.message || '未知错误'}`);
          }

          const data = await response.json();
          const questions = data.choices[0].message.content
            .split('\n')
            .filter(q => q.trim())
            .map(q => ({
              question: q,
              isEditing: false,
              answer: ''
            }));

          return {
            videoPath: video.path,
            questions
          };
        })
      );

      setGeneratedQuestions(questions);
    } catch (err) {
      setError(`生成问题失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate answers
  const generateAnswers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const newQuestions = await Promise.all(
        generatedQuestions.map(async (videoData) => {
          const questionsWithAnswers = await Promise.all(
            videoData.questions.map(async (q) => {
              const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: "glm-4v-plus",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "video_url",
                          video_url: {
                            url: videoData.videoPath
                          }
                        },
                        {
                          type: "text",
                          text: q.question
                        }
                      ]
                    }
                  ],
                  stream: false,
                  temperature: 0.8,
                  top_p: 0.6,
                  max_tokens: 1024
                })
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 请求失败: ${errorData.error?.message || '未知错误'}`);
              }

              const data = await response.json();
              return {
                ...q,
                answer: data.choices[0].message.content
              };
            })
          );

          return {
            ...videoData,
            questions: questionsWithAnswers
          };
        })
      );

      setGeneratedQuestions(newQuestions);
      
      // Convert to final dataset format
      const dataset = newQuestions.flatMap(videoData => {
        const originalVideo = uploadedVideos.find(vid => vid.path === videoData.videoPath);
        const videoPath = originalVideo ? getVideoLocalPath(originalVideo) : '';
        
        return videoData.questions.map(q => ({
          conversations: [
            {
              from: "human",
              value: `<video>${q.question}`
            },
            {
              from: "gpt",
              value: q.answer
            }
          ],
          videos: [videoPath]
        }));
      });

      setFinalDataset(dataset);
    } catch (err) {
      setError(`生成答案失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle video URL submission
  const handleVideoUrlSubmit = async () => {
    if (!videoUrl) {
      setError('请输入视频链接');
      return;
    }

    try {
      // Create a video object similar to uploaded videos
      const timestamp = Date.now();
      const newFileName = `video_${timestamp}_0.mp4`; // Assuming MP4 format
      
      const videoInfo = {
        path: videoUrl,
        originalName: newFileName,
        newName: newFileName,
        isUrl: true // Flag to indicate this is a URL
      };

      setUploadedVideos(prev => [...prev, videoInfo]);
      setRenamedVideos(prev => [...prev, videoInfo]);
      setVideoUrl(''); // Clear input
      setError('');
    } catch (err) {
      setError(`处理视频链接失败: ${err.message}`);
    }
  };

  // Download all content
  const downloadAllContent = async () => {
    if (finalDataset.length === 0 || renamedVideos.length === 0) {
      setError('没有可下载的内容');
      return;
    }

    try {
      setIsLoading(true);
      const zip = new JSZip();
      
      // Create videos folder
      const videoFolder = zip.folder("videos");
      
      // Add all videos
      for (const video of renamedVideos) {
        if (video.isUrl) {
          // For URL videos, try to fetch and add to zip
          try {
            const response = await fetch(video.path);
            if (!response.ok) throw new Error('Failed to fetch video');
            const videoBlob = await response.blob();
            videoFolder.file(video.newName, videoBlob);
          } catch (err) {
            console.warn(`Failed to download video from URL: ${video.path}`);
            // Continue with other videos
          }
        } else {
          // For uploaded videos, use the blob directly
          videoFolder.file(video.newName, video.blob);
        }
      }
      
      // Add dataset JSON file
      zip.file("dataset.json", JSON.stringify(finalDataset, null, 2));
      
      // Generate ZIP file
      const content = await zip.generateAsync({type: "blob"});
      
      // Download ZIP file
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-dataset-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(`打包下载失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          视频理解数据集合成
        </h1>

        {/* Video URL input section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">输入视频链接:</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="输入视频URL (支持mp4格式)"
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleVideoUrlSubmit}
              disabled={!videoUrl || isLoading}
              className={`px-6 py-2 rounded-md text-white ${
                !videoUrl || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              添加视频
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            支持直接输入视频链接，视频大小需小于20M，时长不超过30秒
          </p>
        </div>

        {/* Original file upload area */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">或上传视频文件:</h2>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">点击上传</span> 或拖拽视频到这里
                </p>
                <p className="text-xs text-gray-500">支持 MP4, WebM 等常见视频格式</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="video/*"
                onChange={handleVideoUpload}
              />
            </label>
          </div>
        </div>

        {/* Uploaded videos preview */}
        {uploadedVideos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">已上传的视频:</h2>
            <div className="grid grid-cols-2 gap-4">
              {uploadedVideos.map((video, index) => (
                <div key={index} className="relative">
                  <video
                    src={video.path}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                  <button
                    onClick={() => {
                      setUploadedVideos(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={generateQuestions}
            disabled={isLoading || uploadedVideos.length === 0}
            className={`w-full py-3 rounded-md text-white font-medium ${
              isLoading || uploadedVideos.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? '生成中...' : '生成问题'}
          </button>

          {generatedQuestions.length > 0 && (
            <button
              onClick={generateAnswers}
              disabled={isLoading}
              className={`w-full py-3 rounded-md text-white font-medium ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isLoading ? '生成中...' : '生成答案'}
            </button>
          )}

          {finalDataset.length > 0 && (
            <button
              onClick={downloadAllContent}
              disabled={isLoading}
              className={`w-full py-3 rounded-md text-white font-medium ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isLoading ? '打包中...' : '下载数据集'}
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Generated content preview */}
        {finalDataset.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">生成的数据集:</h2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(finalDataset, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDatasetGenerator; 