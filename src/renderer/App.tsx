import React from 'react';
import FileInputComponent from './components/FileInputComponent';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>DocFlow - AI-Friendly Document Converter</h1>
      <FileInputComponent />
    </div>
  );
};

export default App;
