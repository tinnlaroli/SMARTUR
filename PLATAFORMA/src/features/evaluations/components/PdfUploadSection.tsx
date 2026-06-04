import React, { useRef, useState } from 'react';
import { Upload, Loader2, FileText, RotateCcw, AlertTriangle, X } from 'lucide-react';
import type { EvaluationRubric } from '../types/types';

interface PdfUploadSectionProps {
    rubric: EvaluationRubric;
    serviceName: string;
    onPdfSelected: (file: File) => void;
    isLoading?: boolean;
}

export const PdfUploadSection: React.FC<PdfUploadSectionProps> = ({
    rubric: _rubric,
    serviceName,
    onPdfSelected,
    isLoading = false,
}) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File | null) => {
        setFileError(null);
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setFileError('El archivo debe ser un PDF válido.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setFileError('El archivo es demasiado grande (máximo 10MB).');
            return;
        }

        setSelectedFile(file);
        onPdfSelected(file);
    };

    const handleReplace = () => {
        setSelectedFile(null);
        setFileError(null);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
        fileInputRef.current?.click();
    };

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); };
    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (!isLoading && e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Sube el formulario escaneado</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Carga el formulario de <span className="font-medium text-zinc-700 dark:text-zinc-300">{serviceName}</span> ya rellenado.
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">¿No tienes el formulario? Descárgalo desde el módulo de Instrumentos.</p>
            </div>

            {/* Error message */}
            {fileError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 px-3 py-2">
                    <AlertTriangle className="size-4 shrink-0 text-rose-500" />
                    <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{fileError}</p>
                    <button type="button" onClick={() => setFileError(null)} className="text-rose-400 hover:text-rose-600">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Processing state */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 py-10">
                    <Loader2 className="size-8 animate-spin text-violet-500" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Procesando PDF...</p>
                        {selectedFile && (
                            <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">{selectedFile.name}</p>
                        )}
                    </div>
                </div>
            ) : selectedFile ? (
                /* File selected — show file info + replace button */
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                        <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatSize(selectedFile.size)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleReplace}
                        title="Subir otro archivo"
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors shrink-0"
                    >
                        <RotateCcw className="size-3.5" />
                        Cambiar
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                    />
                </div>
            ) : (
                /* Drop zone */
                <>
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
                            isDragActive
                                ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                        }`}
                    >
                        <div className={`flex size-12 items-center justify-center rounded-xl transition-colors ${
                            isDragActive ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}>
                            <Upload className={`size-6 ${isDragActive ? 'text-violet-500' : 'text-zinc-400'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {isDragActive ? 'Suelta aquí el PDF' : 'Arrastra el PDF o haz clic para seleccionar'}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">PDF · máximo 10 MB</p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
};
