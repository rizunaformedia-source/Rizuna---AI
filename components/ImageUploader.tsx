
import React from 'react';
import { Icon } from './Icon';

export const ImageUploader: React.FC<{ 
    base64Data: string; 
    onFileChange: (file: File) => void; 
    onRemove: () => void; 
    id: string; 
    label?: string;
    isCompact?: boolean;
}> = ({ base64Data, onFileChange, onRemove, id, label, isCompact = false }) => {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (e.dataTransfer.files[0].type && validTypes.includes(e.dataTransfer.files[0].type)) {
        onFileChange(e.dataTransfer.files[0]);
      } else {
        console.error("Invalid file type dropped.");
      }
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(isEntering);
  };
  
  if (base64Data) {
    return (
      <div className={`relative group ${isCompact ? '' : 'mt-2'}`}>
        <img src={base64Data} alt="Preview" className={`w-full ${isCompact ? 'h-24' : 'h-32'} rounded-lg object-cover border border-slate-200`} />
        <div 
          onClick={onRemove} 
          className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg backdrop-blur-sm"
          role="button"
          aria-label="Remove image"
        >
          <Icon path="M6 18L18 6M6 6l12 12" className="w-8 h-8 text-white hover:scale-110 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <label 
      htmlFor={id} 
      className={`cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all group ${
          isDraggingOver 
          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-white/50'
      } ${isCompact ? 'h-24' : 'mt-2 h-32'}`}
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDrop={handleFileDrop}
    >
      <div className="text-center">
        <Icon 
          path="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
          className={`mx-auto ${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-slate-400 group-hover:text-indigo-500 transition-colors`} 
        />
        <p className={`mt-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 group-hover:text-indigo-500`}>
          {isDraggingOver ? 'Drop Here' : (label || 'Upload Image')}
        </p>
      </div>
      <input 
        id={id} 
        name="file-upload" 
        type="file" 
        className="sr-only" 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/webp" 
      />
    </label>
  );
};