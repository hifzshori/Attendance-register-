import React, { useState } from 'react';
import { generateClassroomImage } from '../services/geminiService';
import { ImageSize } from '../types';
import { Image as ImageIcon, Download, Loader2, X } from 'lucide-react';

interface ImageGeneratorProps {
  onClose: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imgData = await generateClassroomImage(prompt, size);
      setGeneratedImage(imgData);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-paper w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-stone-200 flex justify-between items-center">
          <h2 className="font-hand text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="text-blue-600" />
            Classroom Art Generator
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">What would you like to create?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A cute owl mascot for the reading corner, oil painting style"
                className="w-full border-2 border-stone-300 rounded p-3 focus:border-blue-500 focus:outline-none bg-white font-sans"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">Size</label>
              <div className="flex gap-4">
                {Object.values(ImageSize).map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="size"
                      value={s}
                      checked={size === s}
                      onChange={() => setSize(s)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-sans">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Creating...
                </>
              ) : (
                'Generate Art'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">
                {error}
              </div>
            )}

            {generatedImage && (
              <div className="mt-6 border-4 border-white shadow-lg bg-white p-2 transform rotate-1 transition-transform hover:rotate-0">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-auto rounded-sm" 
                />
                <div className="mt-2 flex justify-end">
                   <a 
                     href={generatedImage} 
                     download={`classroom-art-${Date.now()}.png`}
                     className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-sans"
                   >
                     <Download size={16} /> Download
                   </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;