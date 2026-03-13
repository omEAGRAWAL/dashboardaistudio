'use client';

import { useState } from 'react';
import { X, Plus, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploadGridProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  columns?: number;
}

export function ImageUploadGrid({ images, onChange, maxImages = 10, columns = 3 }: ImageUploadGridProps) {
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set());

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files).slice(0, maxImages - images.length);
    if (fileArray.length === 0) return;

    const startIndex = images.length;
    const newUploading = new Set(uploadingSlots);
    fileArray.forEach((_, i) => newUploading.add(startIndex + i));
    setUploadingSlots(newUploading);

    const uploadPromises = fileArray.map(async (file, i) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.secure_url) {
          return data.secure_url;
        }
        throw new Error(data.error || 'Upload failed');
      } catch (error: any) {
        console.error('Upload error:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUrls = results.filter(Boolean) as string[];
    
    onChange([...images, ...successfulUrls]);
    setUploadingSlots(new Set());
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const gridCols = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {images.map((url, index) => (
        <div key={`${url}-${index}`} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-[10px] font-medium truncate">Image {index + 1}</p>
          </div>
        </div>
      ))}

      {/* Uploading slots */}
      {Array.from(uploadingSlots).filter(slot => slot >= images.length).map((slot) => (
        <div key={`uploading-${slot}`} className="aspect-[4/3] rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ))}

      {/* Add Image button */}
      {images.length + uploadingSlots.size < maxImages && (
        <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 flex flex-col items-center justify-center cursor-pointer transition-colors group">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-indigo-500 mt-1 font-medium transition-colors">Add Image</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}

      {images.length === 0 && uploadingSlots.size === 0 && (
        <>
          <div className="aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
          <div className="aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        </>
      )}
    </div>
  );
}
