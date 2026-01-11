import React, { useCallback, useEffect, useState, useRef } from 'react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [inputValue, setInputValue] = useState(currentPage.toString());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 現在のページが変更されたら入力値も更新
  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // 数字のみ許可
      if (value === '' || /^\d+$/.test(value)) {
        setInputValue(value);
      }
    },
    []
  );

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
    // 全選択
    inputRef.current?.select();
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    // 入力値が空または無効な場合は現在のページに戻す
    const pageNum = parseInt(inputValue, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      setInputValue(currentPage.toString());
    } else if (pageNum !== currentPage) {
      onPageChange(pageNum);
    }
  }, [inputValue, currentPage, totalPages, onPageChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const pageNum = parseInt(inputValue, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          onPageChange(pageNum);
          inputRef.current?.blur();
        }
      } else if (e.key === 'Escape') {
        setInputValue(currentPage.toString());
        inputRef.current?.blur();
      }
    },
    [inputValue, currentPage, totalPages, onPageChange]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      // Ignore when focus is in CodeMirror editor
      if (e.target instanceof HTMLElement && e.target.closest('.cm-editor')) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handlePrevious, handleNext]);

  return (
    <div className="page-navigator">
      <button
        type="button"
        className="nav-button"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        ◀
      </button>
      <div className="page-input-container">
        <input
          ref={inputRef}
          type="text"
          className="page-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-label="Page number"
        />
        <span className="page-total">/ {totalPages}</span>
      </div>
      <button
        type="button"
        className="nav-button"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        ▶
      </button>

      <style>{`
        .page-navigator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px;
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
        }

        .nav-button {
          width: 36px;
          height: 36px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background-color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-button:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #2563eb;
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-input-container {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-input {
          width: 40px;
          height: 28px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
          color: #374151;
          padding: 0 4px;
        }

        .page-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        .page-total {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default PageNavigator;
