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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOC_TYPES.map(({ id, label }) => {
          const doc = documents[id];
          const isUploading = uploadingState[id];
          
          return (
            <div key={id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col shadow-sm">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">{label}</h3>
              
              {doc?.publicUrl ? (
                <div className="relative group rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video flex items-center justify-center cursor-pointer border border-zinc-100 dark:border-zinc-700" onClick={() => setViewImage(doc.publicUrl)}>
                  <img src={doc.publicUrl} alt={label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">View</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl aspect-video flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400">
                  <ImageIcon size={24} className="mb-2 opacity-50" />
                  <span className="text-xs">No document</span>
                </div>
              )}
              
              <div className="mt-4 flex gap-2 w-full">
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
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  Capture
                </button>
                <button 
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Upload
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            onClick={(e) => { e.stopPropagation(); setViewImage(null); }}
          >
            <X size={24} />
          </button>
          <img 
            src={viewImage} 
            alt="Document Full View" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
