import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2, Download, Trash2, ChevronDown } from 'lucide-react';
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
  const [expandedDoc, setExpandedDoc] = useState(null); // id of expanded accordion
  
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
    for (const row of data || []) {
      if (!docMap[row.doc_type]) docMap[row.doc_type] = [];
      
      const paths = row.storage_paths || [];
      for (const path of paths) {
        if (!path) continue;
        const { data: signedUrlData } = await supabase
          .storage
          .from('vehicle_documents')
          .createSignedUrl(path, 3600);
          
        docMap[row.doc_type].push({
          id: row.id,
          doc_type: row.doc_type,
          storage_path: path,
          publicUrl: signedUrlData?.signedUrl
        });
      }
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
    // Auto-expand the category when uploading
    setExpandedDoc(docType);
    
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}_${Date.now()}_${crypto.randomUUID().split('-')[0]}.${fileExt}`;
      const filePath = `${userId}/${activeVehicle.id}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('vehicle_documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Fetch existing row for this docType
      const { data: existingRow } = await supabase
        .from('vehicle_documents')
        .select('id, storage_paths')
        .eq('vehicle_id', activeVehicle.id)
        .eq('doc_type', docType)
        .maybeSingle();

      if (existingRow) {
        const newPaths = [...(existingRow.storage_paths || []), uploadData.path];
        const { error: dbError } = await supabase
          .from('vehicle_documents')
          .update({ storage_paths: newPaths })
          .eq('id', existingRow.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from('vehicle_documents')
          .insert({
            user_id: userId,
            vehicle_id: activeVehicle.id,
            doc_type: docType,
            storage_paths: [uploadData.path]
          });
        if (dbError) throw dbError;
      }
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document: ' + (error.message || 'Unknown error'));
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
      // First update the database to remove the path
      const { data: row } = await supabase
        .from('vehicle_documents')
        .select('storage_paths')
        .eq('id', docId)
        .single();
        
      if (row) {
        const newPaths = (row.storage_paths || []).filter(p => p !== storagePath);
        if (newPaths.length === 0) {
          await supabase.from('vehicle_documents').delete().eq('id', docId);
        } else {
          await supabase.from('vehicle_documents').update({ storage_paths: newPaths }).eq('id', docId);
        }
      }
      
      // Then remove the actual file
      await supabase.storage.from('vehicle_documents').remove([storagePath]);
      
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
      
      <div className="flex flex-col gap-3">
        {DOC_TYPES.map(({ id, label }) => {
          const docs = documents[id] || [];
          const isUploading = uploadingState[id];
          const isExpanded = expandedDoc === id;
          
          return (
            <div key={id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
              
              {/* Accordion Header */}
              <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => setExpandedDoc(isExpanded ? null : id)}
              >
                <div className="flex items-center gap-3">
                  {docs.length > 0 ? (
                    <img src={docs[0].publicUrl} alt={`${label} Preview`} className="w-11 h-11 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700">
                      <ImageIcon size={18} className="text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{label}</h3>
                    <p className={`text-[13px] mt-0.5 ${docs.length > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {docs.length > 0 ? `${docs.length} photo${docs.length !== 1 ? 's' : ''}` : 'Missing'}
                    </p>
                  </div>
                </div>
                <div className={`p-2 rounded-full ${isExpanded ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  {docs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-5 px-4 bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 text-center">No photos uploaded yet</p>
                      
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
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                          Camera
                        </button>
                        <button 
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                      {docs.map((doc, idx) => (
                        <div 
                          key={doc.storage_path}
                          className="w-28 h-24 rounded-xl shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer relative group snap-start shadow-sm"
                          onClick={() => setViewImage({ url: doc.publicUrl, id: doc.id, path: doc.storage_path, label })}
                        >
                          <img src={doc.publicUrl} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium uppercase tracking-wider">View</span>
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.storage_path); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/40 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
                            title="Delete photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Buttons */}
                      <div className="flex flex-col items-center gap-2 shrink-0 snap-start pl-1">
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
                          className="w-14 h-[44px] bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        </button>
                        <button 
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[`${id}_upload`]?.click()}
                          className="w-14 h-[44px] bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="absolute top-4 w-full px-4 flex justify-between items-center z-[110]">
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
          
          <div className="absolute bottom-12 flex gap-4 z-[110]">
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
