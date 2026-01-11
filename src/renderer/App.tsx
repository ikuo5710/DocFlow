import React, { useState, useCallback } from 'react';
import FileInputComponent from './components/FileInputComponent';
import ParallelViewer from './components/ParallelViewer';
import { FileInfo } from '../types/file';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  const handleFileSelect = useCallback((file: FileInfo) => {
    setSelectedFile(file);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className="app">
      {selectedFile ? (
        <ParallelViewer file={selectedFile} onClose={handleCloseViewer} />
      ) : (
        <>
          <h1>DocFlow - AI-Friendly Document Converter</h1>
          <FileInputComponent onFileSelect={handleFileSelect} />
        </>
      )}
    </div>
  );
};

export default App;
