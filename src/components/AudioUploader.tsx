"use client";

import { useState, useCallback } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AudioUploaderProps {
    onFileSelect: (file: File) => void;
}

export function AudioUploader({ onFileSelect }: AudioUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("audio/")) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out",
                    isDragging
                        ? "border-indigo-500 bg-indigo-500/5 scale-[1.02]"
                        : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50",
                    selectedFile ? "border-solid border-indigo-500/20 bg-indigo-50/30" : ""
                )}
            >
                <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <AnimatePresence mode="wait">
                        {!selectedFile ? (
                            <motion.div
                                key="upload-prompt"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center"
                            >
                                <div className="mb-6 rounded-full bg-indigo-50 p-4 ring-1 ring-indigo-100 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                                    <Upload className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                                    Upload Call Recording
                                </h3>
                                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                                    Drag and drop your audio file here, or click to browse.
                                    Supports MP3, WAV, M4A.
                                </p>
                                <div className="rounded-full bg-white dark:bg-slate-900 px-4 py-2 text-xs font-medium text-indigo-600 shadow-sm ring-1 ring-slate-200 group-hover:ring-indigo-200">
                                    Select File
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="file-selected"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-indigo-100 p-3">
                                        <FileAudio className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900 dark:text-slate-50 truncate max-w-[200px]">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="z-20 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 hover:text-slate-600 dark:text-slate-400"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
