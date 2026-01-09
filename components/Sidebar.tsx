import React, { useState, useRef } from 'react';
import { DocumentFile } from '../types';
import { n8nService } from '../services/n8nService';

interface SidebarProps {
    onNavigate: (view: 'chat' | 'flashcards') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<DocumentFile[]>([
        { id: '1', name: 'Q3_Financial_Report.pdf', type: 'application/pdf', status: 'indexed' },
        { id: '2', name: 'Project_Alpha_Specs.pdf', type: 'application/pdf', status: 'indexed' },
        { id: '3', name: 'Meeting_Notes_Oct.txt', type: 'text/plain', status: 'indexed' },
    ]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newDoc = await n8nService.uploadDocument(file);
            setDocuments(prev => [...prev, newDoc]);
        } catch (error) {
            alert("Failed to upload document");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <aside className="w-80 flex-shrink-0 flex flex-col bg-sidebar-dark border-r border-white/5 h-full z-20">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 cursor-pointer" onClick={() => onNavigate('chat')}>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>neurology</span>
                    <div className="flex flex-col">
                        <h3 className="text-white tracking-tight text-xl font-bold leading-tight">LocalMind</h3>
                    </div>
                </div>
            </div>

            {/* Sources Header */}
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sources</h4>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{documents.length}</span>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
                {documents.map((doc) => (
                    <div key={doc.id} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                        <div className="flex items-center justify-center rounded bg-[#242447] text-white shrink-0 size-10">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                {doc.type.includes('pdf') ? 'picture_as_pdf' : 'description'}
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-gray-200 text-sm font-medium leading-tight truncate">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`size-1.5 rounded-full ${doc.status === 'indexed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                <p className="text-[#9293c8] text-xs font-normal truncate capitalize">{doc.status}</p>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-gray-500 hover:text-white" style={{ fontSize: '18px' }}>more_vert</span>
                        </div>
                    </div>
                ))}
                {isUploading && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="size-10 flex items-center justify-center">
                            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-gray-200 text-sm">Uploading...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Dropzone / Upload Button */}
            <div className="p-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#333466] bg-white/5 hover:bg-white/10 transition-colors p-4 cursor-pointer group disabled:opacity-50"
                >
                    <div className="p-2 bg-[#242447] rounded-full group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>cloud_upload</span>
                    </div>
                    <div className="text-center">
                        <p className="text-white text-xs font-bold leading-tight">Add Source</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">PDF, TXT, MD</p>
                    </div>
                </button>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <img 
                        src="https://picsum.photos/100" 
                        alt="User"
                        className="rounded-full size-9 shadow-inner border border-white/10" 
                    />
                    <div className="flex flex-col min-w-0">
                        <p className="text-white text-sm font-medium leading-tight truncate">User</p>
                        <p className="text-[#9293c8] text-xs font-normal truncate">user@localmind.ai</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-500 ml-auto" style={{ fontSize: '18px' }}>settings</span>
                </div>
            </div>
        </aside>
    );
};