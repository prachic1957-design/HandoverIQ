import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileCheck2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Search,
  Building2,
  Users,
  Briefcase,
  X,
  File,
  Layers,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function KnowledgeUploadView() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadEmployeeId, setUploadEmployeeId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal / Drawer States
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [docChunks, setDocChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);

  // Alerts
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, projRes, empRes] = await Promise.all([
        fetch(`${API_BASE}/documents`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/employees`)
      ]);

      const docData = await docRes.json();
      const projData = await projRes.json();
      const empData = await empRes.json();

      if (docData.success) {
        setDocuments(docData.data);
      }
      if (projData.success) {
        setProjects(projData.data);
        if (!uploadProjectId && projData.data.length > 0) {
          setUploadProjectId(projData.data[0].id);
        }
      }
      if (empData.success) {
        setEmployees(empData.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      (doc.projects?.name && doc.projects.name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.employees?.full_name && doc.employees.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchesProject = !selectedProjectFilter || doc.project_id === selectedProjectFilter;
    const matchesStatus = !selectedStatusFilter || doc.processing_status === selectedStatusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const valid = ['pdf', 'docx', 'txt', 'csv'].includes(ext);
    if (!valid) {
      setError(`Invalid format (.${ext}). Only PDF, DOCX, TXT, and CSV documents are supported.`);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a document file to upload.');
      return;
    }
    if (!uploadProjectId) {
      setError('Please choose a project to associate this knowledge document with.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project_id', uploadProjectId);
      if (uploadEmployeeId) {
        formData.append('employee_id', uploadEmployeeId);
      }

      setUploadProgress(50);
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to upload document');
      }

      setUploadProgress(100);
      setSuccess(`"${selectedFile.name}" ingested and processed successfully (${data.data.chunk_count || 0} source chunks created).`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Inspect Document & Fetch its Chunks
  const handleInspectDoc = async (doc) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await fetch(`${API_BASE}/documents/${doc.id}/chunks`);
      const data = await res.json();
      if (data.success) {
        setDocChunks(data.data);
      } else {
        setDocChunks([]);
      }
    } catch (err) {
      console.warn('Error fetching chunks:', err);
      setDocChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Delete Document
  const handleDelete = async () => {
    if (!deletingDoc) return;

    try {
      const res = await fetch(`${API_BASE}/documents/${deletingDoc.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to delete document');
      }

      setSuccess(`"${deletingDoc.original_filename}" removed from knowledge repository.`);
      if (inspectingDoc?.id === deletingDoc.id) {
        setInspectingDoc(null);
      }
      setDeletingDoc(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
      setDeletingDoc(null);
    }
  };

  // Secure Download Handler
  const handleDownload = (doc) => {
    window.open(`${API_BASE}/documents/${doc.id}/download`, '_blank');
  };

  // Helper icons by extension
  const getFileIcon = (filename, mimeType) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (ext === 'csv' || mimeType?.includes('csv') || mimeType?.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (ext === 'docx' || mimeType?.includes('word')) {
      return <FileCheck2 className="w-5 h-5 text-blue-400" />;
    }
    return <FileCode className="w-5 h-5 text-amber-400" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Extracted
          </span>
        );
      case 'needs_ocr':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Scanned or image PDF requiring OCR">
            <AlertTriangle className="w-3 h-3" /> Needs OCR
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> Ingesting
          </span>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Knowledge Ingestion Engine</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingest technical specifications, status memos, sprint reviews, and handover documentation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="px-2.5 py-1 rounded bg-[#0E172E] border border-slate-800 text-slate-300">
            Supported: <strong>PDF, DOCX, TXT, CSV</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Max: <strong>25 MB</strong>
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Document Repository */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Drag & Drop Ingestion Form */}
        <div className="lg:col-span-1 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              Ingest Document
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Map files directly to project deliverable pipelines.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Project Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Project <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Optional Author Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Author / Handover Owner (Optional)
                </label>
                <select
                  value={uploadEmployeeId}
                  onChange={(e) => setUploadEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E172E] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">General Project Document</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-[#0E172E]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.csv"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      {getFileIcon(selectedFile.name, selectedFile.type)}
                    </div>
                    <div className="text-xs font-bold text-white truncate px-2">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-400">{formatFileSize(selectedFile.size)}</div>
                    <span className="inline-block text-[10px] text-blue-400 hover:underline">Click to change file</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      Drop document here or <span className="text-blue-400 underline">browse</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PDF, Word (.docx), Plain Text (.txt), CSV
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Extracting text & chunking...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Action Button */}
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Ingest Knowledge</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Encrypted storage in private bucket with SHA-256 integrity verification.</span>
          </div>
        </div>

        {/* Right Column: Ingested Documents List */}
        <div className="lg:col-span-2 rounded-xl bg-[#14213D]/70 border border-slate-800/80 shadow-lg overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search filename or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Extracted</option>
                <option value="needs_ocr">Needs OCR</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 self-end md:self-auto">
              <span>Showing: <strong className="text-white">{filteredDocuments.length}</strong> of {documents.length}</span>
              <button
                onClick={fetchData}
                className="p-1.5 rounded-lg bg-[#0E172E] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh documents"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0E172E]/50">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Associated Project</th>
                  <th className="py-3 px-4">Author / Owner</th>
                  <th className="py-3 px-4 text-center">Source Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      <span>Loading documents...</span>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <File className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="font-medium text-slate-300">No documents ingested yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use the ingestion box on the left to upload technical files.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#0E172E]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0E172E] border border-slate-800 shrink-0">
                            {getFileIcon(doc.original_filename, doc.mime_type)}
                          </div>
                          <div>
                            <div className="font-semibold text-white max-w-[200px] truncate" title={doc.original_filename}>
                              {doc.original_filename}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-medium text-slate-200">{doc.projects?.name || 'Unassigned'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {doc.employees?.full_name ? (
                          <div>
                            <div className="font-medium text-white">{doc.employees.full_name}</div>
                            <div className="text-[10px] text-slate-400">{doc.employees.designation}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Project Wide</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Layers className="w-3 h-3" />
                          <span>{doc.chunk_count !== undefined ? doc.chunk_count : 0} chunks</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(doc.processing_status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectDoc(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Inspect Extracted Chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Download Source Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingDoc(doc)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Inspector Modal (Preview Chunks & Traceability) */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0E172E] border border-slate-700 p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  {getFileIcon(inspectingDoc.original_filename, inspectingDoc.mime_type)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{inspectingDoc.original_filename}</span>
                    {getStatusBadge(inspectingDoc.processing_status)}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                    <span>Project: <strong className="text-slate-200">{inspectingDoc.projects?.name}</strong></span>
                    {inspectingDoc.employees?.full_name && (
                      <span>Author: <strong className="text-slate-200">{inspectingDoc.employees.full_name}</strong></span>
                    )}
                    <span>Size: {formatFileSize(inspectingDoc.file_size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(inspectingDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setInspectingDoc(null)}
                  className="text-slate-400 hover:text-white p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Chunks & Traceable Sources */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {inspectingDoc.processing_error && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Extraction Notice:</span> {inspectingDoc.processing_error}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Source-Linked Knowledge Chunks ({docChunks.length})</span>
                  <span className="text-[10px] text-slate-500 lowercase">Prepared for Phase 4 AI Synthesis</span>
                </h4>

                {loadingChunks ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Loading traceable chunks...</span>
                  </div>
                ) : docChunks.length === 0 ? (
                  <div className="p-6 rounded-lg bg-[#0B1020] border border-slate-800 text-center text-xs text-slate-400">
                    No discrete text chunks extracted.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {docChunks.map((chunk, idx) => (
                      <div
                        key={chunk.id || idx}
                        className="p-3.5 rounded-lg bg-[#0B1020] border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                          <span className="font-mono font-semibold text-blue-400">
                            Chunk #{chunk.chunk_index + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                            {chunk.page_number ? `Page ${chunk.page_number}` : (chunk.section_reference || 'General Section')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                          {chunk.extracted_content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="font-mono truncate max-w-md">Storage Key: {inspectingDoc.storage_path}</span>
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0E172E] border border-rose-500/30 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Document?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deletingDoc.original_filename}"</strong>?
              This will permanently purge the stored file and all its extracted knowledge chunks.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
