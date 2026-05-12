import { useState } from 'react';
import { Video, X, Loader } from 'lucide-react';

const CLOUD_NAME = 'ddqb2tfvn';
const UPLOAD_PRESET = 'billetvote';

export default function VideoUpload({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(value || null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('Fichier trop lourd (max 50MB)');
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'video');

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = reject;
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
        xhr.send(formData);
      });

      if (result.secure_url) {
        setPreview(result.secure_url);
        onChange(result.secure_url);
      }
    } catch (err) {
      console.error('Erreur upload video:', err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div>
      {preview ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-black">
          <video src={preview} controls className="w-full max-h-48 object-contain" />
          <button type="button" onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition z-10">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-400 transition bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader size={20} className="text-violet-500 animate-spin" />
              <span className="text-sm text-gray-400">{progress}% uploade...</span>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <Video size={20} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Cliquez pour choisir une video</span>
              <span className="text-xs text-gray-300 mt-1">MP4, MOV, WEBM — max 50MB</span>
            </>
          )}
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={loading} />
        </label>
      )}
    </div>
  );
}
