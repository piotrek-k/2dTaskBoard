import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
}

function FileUploader({ onFileUpload }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    await onFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const fileUploaderContainerRef = useHotkeys("enter", () => fileInputRef.current?.click());

  return (
    <div
      className={`mt-4 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer focus:border-blue-500 focus:bg-slate-400 focus:text-black ${
        isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
      }`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      ref={fileUploaderContainerRef}
    >
      <p>Drag and drop a file here, or click to select a file</p>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
    </div>
  );
};

export default FileUploader;