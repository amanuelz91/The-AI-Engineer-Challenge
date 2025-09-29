"use client";

/**
 * PDF upload component for RAG functionality
 */

import { useState, useRef } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { ChatApiService } from "@/services/chatApi";
import { UploadedPDF, PDFListItem } from "@/types/chat";

interface PDFUploadProps {
  apiKey: string;
  onPDFUploaded: (pdf: UploadedPDF) => void;
  uploadedPDFs: PDFListItem[];
  selectedPDFId: string | null;
  onPDFSelected: (pdfId: string | null) => void;
  onPDFDeleted: (pdfId: string) => void;
}

export function PDFUpload({
  apiKey,
  onPDFUploaded,
  uploadedPDFs,
  selectedPDFId,
  onPDFSelected,
  onPDFDeleted,
}: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!apiKey.trim()) {
      setUploadError("Please set your OpenAI API key first");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await ChatApiService.uploadPDF(file, apiKey);
      onPDFUploaded(result);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleDeletePDF = async (pdfId: string) => {
    try {
      await ChatApiService.deletePDF(pdfId);
      onPDFDeleted(pdfId);
      
      // If the deleted PDF was selected, clear selection
      if (selectedPDFId === pdfId) {
        onPDFSelected(null);
      }
    } catch (error) {
      console.error('Failed to delete PDF:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <Upload className={`mx-auto h-8 w-8 ${isUploading ? 'text-gray-400' : 'text-gray-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isUploading ? 'text-gray-400' : 'text-gray-700'}`}>
              {isUploading ? 'Uploading and indexing PDF...' : 'Upload a PDF file'}
            </p>
            <p className={`text-xs ${isUploading ? 'text-gray-400' : 'text-gray-500'}`}>
              Click here or drag and drop
            </p>
          </div>
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded PDFs List */}
      {uploadedPDFs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded PDFs:</h4>
          <div className="space-y-2">
            {uploadedPDFs.map((pdf) => (
              <div
                key={pdf.pdf_id}
                className={`
                  flex items-center justify-between p-3 rounded-md border transition-colors
                  ${selectedPDFId === pdf.pdf_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => onPDFSelected(selectedPDFId === pdf.pdf_id ? null : pdf.pdf_id)}
                >
                  <File size={16} className="text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      PDF {pdf.pdf_id.substring(4, 12)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {pdf.chunks_count} chunks indexed
                    </p>
                  </div>
                  {selectedPDFId === pdf.pdf_id && (
                    <CheckCircle size={16} className="text-blue-600" />
                  )}
                </div>
                <button
                  onClick={() => handleDeletePDF(pdf.pdf_id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete PDF"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {selectedPDFId && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
              ✓ Selected PDF will be used for context in your chat
            </div>
          )}
        </div>
      )}
    </div>
  );
}
