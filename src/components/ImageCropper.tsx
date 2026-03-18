import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col animate-in fade-in duration-300">
      <div className="p-6 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <button onClick={onCancel} className="p-3 bg-slate-800 text-slate-400 rounded-2xl active:scale-90 transition-all">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-white font-black uppercase tracking-widest text-sm">ছবি ক্রপ করুন</h3>
        <button onClick={handleCrop} className="p-3 bg-emerald-600 text-white rounded-2xl active:scale-90 transition-all shadow-lg shadow-emerald-900/20">
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-grow bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: { border: '2px solid white', borderRadius: '4px' }
          }}
        />
      </div>

      <div className="p-8 bg-slate-900 border-t border-slate-800 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>জুম</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-slate-500" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-grow h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <ZoomIn className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>ঘুরান</span>
            <span>{rotation}°</span>
          </div>
          <div className="flex items-center gap-4">
            <RotateCcw className="w-5 h-5 text-slate-500" />
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-grow h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
