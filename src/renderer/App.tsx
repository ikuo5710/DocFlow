import React, { useCallback } from 'react';
import FileInputComponent from './components/FileInputComponent';
import ParallelViewer from './components/ParallelViewer';
import FileNavigator from './components/FileNavigator';
import { FileInfo } from '../types/file';
import { useFileList } from './hooks/useFileList';

const App: React.FC = () => {
  const {
    files,
    currentFile,
    currentFileIndex,
    addFile,
    removeFile,
    selectFile,
    selectPreviousFile,
    selectNextFile,
    clearAll,
  } = useFileList();

  const handleFileSelect = useCallback(
    (file: FileInfo) => {
      addFile(file);
    },
    [addFile]
  );

  const handleCloseViewer = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return (
    <div className="app">
      {currentFile ? (
        <>
          <FileNavigator
            files={files}
            currentFileIndex={currentFileIndex}
            onSelectFile={selectFile}
            onSelectPrevious={selectPreviousFile}
            onSelectNext={selectNextFile}
            onRemoveFile={removeFile}
          />
          <ParallelViewer file={currentFile} onClose={handleCloseViewer} />
        </>
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
