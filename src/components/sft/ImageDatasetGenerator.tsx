import { useState, useCallback } from 'react';
import { Image, Upload, Sparkles, Download, Grid } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ImageItem {
  id: string;
  file: File | null;
  preview: string;
  description: string;
  tags: string[];
}

export function ImageDatasetGenerator() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newImages: ImageItem[] = [];

      for (const file of Array.from(files)) {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        newImages.push({
          id: `img-${Date.now()}-${Math.random()}`,
          file,
          preview,
          description: '',
          tags: [],
        });
      }

      setImages([...images, ...newImages]);
    },
    [images]
  );

  const handleGenerateDescription = useCallback(async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image || !image.file) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', image.file);

      const response = await fetch('/api/sft/generate-image-description', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      setImages(
        images.map((img) =>
          img.id === imageId ? { ...img, description: data.description } : img
        )
      );
    } catch (error) {
      console.error('Description generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [images]);

  const handleGenerateAll = useCallback(async () => {
    setIsGenerating(true);
    const newImages = [...images];

    for (const image of newImages) {
      if (!image.file || image.description) continue;

      try {
        const formData = new FormData();
        formData.append('image', image.file);

        const response = await fetch('/api/sft/generate-image-description', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        image.description = data.description;
      } catch (error) {
        console.error('Description generation failed:', error);
      }
    }

    setImages(newImages);
    setIsGenerating(false);
  }, [images]);

  const handleExport = useCallback(() => {
    const exportData = images.map((img) => ({
      image: img.preview,
      description: img.description,
      tags: img.tags,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-dataset.json';
    a.click();
  }, [images]);

  const handleRemoveImage = useCallback((imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
  }, [images]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            图片数据集生成器
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            上传图片并生成描述,构建图像数据集
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative">
            <Button variant="filled" icon={<Upload size={18} />}>
              上传图片
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </div>
          {images.length > 0 && (
            <>
              <Button
                variant="outlined"
                onClick={handleGenerateAll}
                loading={isGenerating}
                icon={<Sparkles size={18} />}
              >
                批量生成描述
              </Button>
              <Button
                variant="tonal"
                onClick={handleExport}
                disabled={images.filter((img) => img.description).length === 0}
                icon={<Download size={18} />}
              >
                导出数据集 ({images.filter((img) => img.description).length})
              </Button>
            </>
          )}
        </div>

        {images.length === 0 ? (
          <Card className="p-12 text-center">
            <Image size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              点击上方按钮上传图片
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      描述
                    </span>
                    {!image.description && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleGenerateDescription(image.id)}
                        icon={<Sparkles size={14} />}
                      >
                        生成
                      </Button>
                    )}
                  </div>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-sm dark:bg-gray-800"
                    rows={3}
                    placeholder="图片描述..."
                    value={image.description}
                    onChange={(e) =>
                      setImages(
                        images.map((img) =>
                          img.id === image.id
                            ? { ...img, description: e.target.value }
                            : img
                        )
                      )
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
