import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useVehicle } from '../contexts/VehicleContext';

const DOC_TYPES = [
  { id: 'driving_license', label: 'Driving License' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'bluebook', label: 'Bluebook' }
];

export default function VehicleDocuments() {
  const { activeVehicle } = useVehicle();
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState({}); // docType -> boolean
  const [viewImage, setViewImage] = useState(null);
  
  const fileInputRefs = useRef({});

  useEffect(() => {
    let isMounted = true;
    
    const fetchDocuments = async () => {
      if (!activeVehicle?.id) {
        if (isMounted) setDocuments({});
        return;
      }
      
      if (isMounted) setLoading(true);
      
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', activeVehicle.id);
        
      if (error) {
        console.error('Error fetching docs:', error);
        if (isMounted) setLoading(false);
        return;
      }
      
      if (isMounted) {
        const docMap = {};
        for (const doc of data || []) {
          // Get public URL
          const { data: publicUrlData } = supabase
            .storage
            .from('vehicle_documents')
            .getPublicUrl(doc.storage_path);
            
          docMap[doc.doc_type] = {
            ...doc,
            publicUrl: publicUrlData.publicUrl
          };
        }
        setDocuments(docMap);
        setLoading(false);
      }
    };
    
    fetchDocuments();
    
    return () => { isMounted = false; };
  }, [activeVehicle?.id]);

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file || !activeVehicle?.id) return;
    
    setUploadingState(prev => ({ ...prev, [docType]: true }));
    
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      
      if (!userId) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${activeVehicle.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('vehicle_documents')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Update or insert into vehicle_documents table
      const { data: existingDoc } = await supabase
        .from('vehicle_documents')
        .select('id')
        .eq('vehicle_id', activeVehicle.id)
        .eq('doc_type', docType)
        .single();
        
      if (existingDoc) {
        await supabase
          .from('vehicle_documents')
          .update({ storage_path: uploadData.path, updated_at: new Date() })
          .eq('id', existingDoc.id);
      } else {
        await supabase
          .from('vehicle_documents')
          .insert({
            user_id: userId,
            vehicle_id: activeVehicle.id,
            doc_type: docType,
            storage_path: uploadData.path
          });
      }
      
      // Refresh docs
      const { data: publicUrlData } = supabase
        .storage
        .from('vehicle_documents')
        .getPublicUrl(uploadData.path);
        
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          doc_type: docType,
          storage_path: uploadData.path,
          publicUrl: publicUrlData.publicUrl
        }
      }));
      
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploadingState(prev => ({ ...prev, [docType]: false }));
      // Reset input
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType].value = '';
      }
    }
  };

  if (!activeVehicle?.id) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 px-1">
        <FileText size={14} />
        Important Documents
      </h2>
      
      <div className="flex flex-col gap-3">
        {DOC_TYPES.map(({ id, label }) => {
          const doc = documents[id];
          const isUploading = uploadingState[id];
          
          return (
            <div key={id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex items-center shadow-sm">
              
              {/* Thumbnail / Placeholder */}
              <div 
                className={`w-16 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border ${doc?.publicUrl ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 cursor-pointer relative group' : 'bg-zinc-50 dark:bg-zinc-800/50 border-dashed border-zinc-200 dark:border-zinc-700'}`}
                onClick={() => doc?.publicUrl && setViewImage(doc.publicUrl)}
              >
                {doc?.publicUrl ? (
                  <>
                    <img src={doc.publicUrl} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium uppercase tracking-wider">View</span>
                    </div>
                  </>
                ) : (
                  <ImageIcon size={20} className="text-zinc-400 opacity-50" />
                )}
              </div>
              
              {/* Info */}
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm truncate">{label}</h3>
                <div className="flex items-center mt-0.5">
                  <span className={`text-xs font-medium ${doc?.publicUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {doc?.publicUrl ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 ml-2 shrink-0">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={el => fileInputRefs.current[`${id}_capture`] = el}
                  onChange={(e) => handleFileUpload(e, id)}
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={el => fileInputRefs.current[`${id}_upload`] = el}
                  onChange={(e) => handleFileUpload(e, id)}
                />
                
                <button 
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[`${id}_capture`]?.click()}
                  className="w-9 h-9 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Capture with camera"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                </button>
                <button 
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                  className="w-9 h-9 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Upload from gallery"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setViewImage(null); }}
          >
            <X size={24} />
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={viewImage} 
              alt="Document Full View" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
