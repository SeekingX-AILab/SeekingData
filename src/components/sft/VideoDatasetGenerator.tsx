import { useState, useCallback } from 'react';
import { Video, Upload, Sparkles, Download, Play, Pause } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface VideoItem {
  id: string;
  file: File | null;
  preview: string;
  description: string;
  frames: string[];
  duration: number;
}

export function VideoDatasetGenerator() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newVideos: VideoItem[] = [];

      for (const file of Array.from(files)) {
        const preview = URL.createObjectURL(file);

        newVideos.push({
          id: `video-${Date.now()}-${Math.random()}`,
          file,
          preview,
          description: '',
          frames: [],
          duration: 0,
        });
      }

      setVideos([...videos, ...newVideos]);
    },
    [videos]
  );

  const handleGenerateDescription = useCallback(async (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video || !video.file) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('video', video.file);

      const response = await fetch('/api/sft/generate-video-description', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      setVideos(
        videos.map((v) =>
          v.id === videoId
            ? { ...v, description: data.description, frames: data.frames }
            : v
        )
      );
    } catch (error) {
      console.error('Description generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [videos]);

  const handleExport = useCallback(() => {
    const exportData = videos.map((v) => ({
      video: v.preview,
      description: v.description,
      frames: v.frames,
      duration: v.duration,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-dataset.json';
    a.click();
  }, [videos]);

  const togglePlay = useCallback((videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  }, [playingVideo]);

  const handleRemoveVideo = useCallback((videoId: string) => {
    setVideos(videos.filter((v) => v.id !== videoId));
  }, [videos]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            视频数据集生成器
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            上传视频并生成描述,构建视频理解数据集
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative">
            <Button variant="filled" icon={<Upload size={18} />}>
              上传视频
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </div>
          {videos.filter((v) => v.description).length > 0 && (
            <Button
              variant="tonal"
              onClick={handleExport}
              icon={<Download size={18} />}
            >
              导出数据集 ({videos.filter((v) => v.description).length})
            </Button>
          )}
        </div>

        {videos.length === 0 ? (
          <Card className="p-12 text-center">
            <Video size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              点击上方按钮上传视频
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <video
                    src={video.preview}
                    className="w-full h-full object-contain"
                    controls={playingVideo === video.id}
                  />
                  <button
                    onClick={() => togglePlay(video.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
                  >
                    {playingVideo === video.id ? (
                      <Pause size={48} className="text-white" />
                    ) : (
                      <Play size={48} className="text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      视频描述
                    </span>
                    {!video.description && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleGenerateDescription(video.id)}
                        loading={isGenerating}
                        icon={<Sparkles size={14} />}
                      >
                        生成描述
                      </Button>
                    )}
                  </div>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-sm dark:bg-gray-800"
                    rows={4}
                    placeholder="视频内容描述..."
                    value={video.description}
                    onChange={(e) =>
                      setVideos(
                        videos.map((v) =>
                          v.id === video.id
                            ? { ...v, description: e.target.value }
                            : v
                        )
                      )
                    }
                  />
                  {video.frames.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        关键帧 ({video.frames.length})
                      </span>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {video.frames.slice(0, 8).map((frame, index) => (
                          <img
                            key={index}
                            src={frame}
                            alt={`Frame ${index + 1}`}
                            className="w-full aspect-video object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
