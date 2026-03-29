import React, { useCallback, useState } from 'react';
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

  const [batchFiles, setBatchFiles] = useState<FileInfo[] | null>(null);

  const handleFileSelect = useCallback(
    (file: FileInfo) => {
      addFile(file);
    },
    [addFile]
  );

  const handleBatchOCR = useCallback((imageFiles: FileInfo[]) => {
    setBatchFiles(imageFiles);
  }, []);

  const handleCloseViewer = useCallback(() => {
    clearAll();
    setBatchFiles(null);
  }, [clearAll]);

  // バッチモード: batchFilesが設定されている場合
  if (batchFiles && batchFiles.length > 0) {
    return (
      <div className="app">
        <ParallelViewer
          file={batchFiles[0]}
          batchFiles={batchFiles}
          onClose={handleCloseViewer}
        />
      </div>
    );
  }

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
          <FileInputComponent
            onFileSelect={handleFileSelect}
            onBatchOCR={handleBatchOCR}
          />
        </>
      )}
    </div>
  );
};

export default App;
