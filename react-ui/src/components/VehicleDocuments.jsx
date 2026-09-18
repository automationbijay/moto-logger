import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2, Download, Trash2, Plus } from 'lucide-react';
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
  const [viewImage, setViewImage] = useState(null); // { url, id, path }
  
  const fileInputRefs = useRef({});

  const fetchDocuments = async () => {
    if (!activeVehicle?.id) {
      setDocuments({});
      return;
    }
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', activeVehicle.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching docs:', error);
      setLoading(false);
      return;
    }
    
    const docMap = {};
    for (const doc of data || []) {
      const { data: signedUrlData } = await supabase
        .storage
        .from('vehicle_documents')
        .createSignedUrl(doc.storage_path, 3600);
        
      if (!docMap[doc.doc_type]) docMap[doc.doc_type] = [];
      
      docMap[doc.doc_type].push({
        ...doc,
        publicUrl: signedUrlData?.signedUrl
      });
    }
    setDocuments(docMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Generate a unique file name to avoid overwriting
      const fileName = `${docType}_${Date.now()}_${crypto.randomUUID().split('-')[0]}.${fileExt}`;
      const filePath = `${userId}/${activeVehicle.id}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('vehicle_documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { error: dbError } = await supabase
        .from('vehicle_documents')
        .insert({
          user_id: userId,
          vehicle_id: activeVehicle.id,
          doc_type: docType,
          storage_path: uploadData.path
        });

      if (dbError) throw dbError;
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.message?.includes('duplicate key') 
        ? 'Please run the database migration to allow multiple photos first!' 
        : 'Failed to upload document');
    } finally {
      setUploadingState(prev => ({ ...prev, [docType]: false }));
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType].value = '';
      }
    }
  };

  const handleDelete = async (docId, storagePath) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await supabase.storage.from('vehicle_documents').remove([storagePath]);
      await supabase.from('vehicle_documents').delete().eq('id', docId);
      
      setViewImage(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (url, type) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${type}_document.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image.');
    }
  };

  if (!activeVehicle?.id) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 px-1">
        <FileText size={14} />
        Important Documents
      </h2>
      
      <div className="flex flex-col gap-4">
        {DOC_TYPES.map(({ id, label }) => {
          const docs = documents[id] || [];
          const isUploading = uploadingState[id];
          
          return (
            <div key={id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{label}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${docs.length > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                  {docs.length} photo{docs.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                  <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700 mb-3">
                    <ImageIcon size={20} className="text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4 text-center">No photos uploaded yet</p>
                  
                  <div className="flex items-center gap-3">
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
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                      Camera
                    </button>
                    <button 
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-2 px-2 snap-x">
                  {docs.map((doc, idx) => (
                    <div 
                      key={doc.id}
                      className="w-24 h-20 rounded-xl shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer relative group snap-start"
                      onClick={() => setViewImage({ url: doc.publicUrl, id: doc.id, path: doc.storage_path, label })}
                    >
                      <img src={doc.publicUrl} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-medium uppercase tracking-wider">View</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Upload Buttons */}
                  <div className="flex items-center gap-2 shrink-0 snap-start pl-1">
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
                      className="w-12 h-20 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    </button>
                    <button 
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                      className="w-12 h-20 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="absolute top-4 w-full px-4 flex justify-between items-center z-50">
            <div className="text-white font-medium">{viewImage.label}</div>
            <button 
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
              onClick={(e) => { e.stopPropagation(); setViewImage(null); }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center py-16">
            <img 
              src={viewImage.url} 
              alt="Document Full View" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="absolute bottom-8 flex gap-4 z-50">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDownload(viewImage.url, viewImage.label); }}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2 font-medium"
            >
              <Download size={20} />
              Download
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(viewImage.id, viewImage.path); }}
              className="bg-red-500/20 hover:bg-red-500/40 text-red-100 px-6 py-3 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2 font-medium"
            >
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
