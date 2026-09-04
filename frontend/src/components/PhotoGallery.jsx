import { useRef } from 'react';
import { Trash2, Upload as UploadIcon } from 'lucide-react';
import { API_ORIGIN } from '../api/client';

export default function PhotoGallery({ photos, onUpload, onDelete }) {
  const inputRef = useRef(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate">Photo Gallery</h3>
        <button className="btn-secondary" onClick={() => inputRef.current?.click()}>
          <UploadIcon size={16} /> Upload photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files.length && onUpload(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-gray-500">No photos yet. Upload some to build the gallery for this event's report.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => {
            const relative = photo.file_path.split('uploads/photos/')[1];
            const src = `${API_ORIGIN}/uploads/photos/${relative}`;
            return (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                <img src={src} alt={photo.caption || 'Event photo'} className="w-full h-full object-cover" />
                <button
                  onClick={() => onDelete(photo.id)}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
