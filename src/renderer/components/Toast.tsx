import React, { useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
  autoCloseDuration?: number; // ミリ秒、0で自動非表示なし
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onClose,
  autoCloseDuration = 3000,
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && autoCloseDuration > 0 && type === 'success') {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseDuration, type, handleClose]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
      data-testid="toast"
    >
      <div className="toast-content">
        <span className="toast-icon" aria-hidden="true">
          {type === 'success' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 300px;
          max-width: 500px;
          animation: slideIn 0.3s ease-out;
          z-index: 1000;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast-success {
          background-color: #dcfce7;
          border: 1px solid #16a34a;
          color: #166534;
        }

        .toast-error {
          background-color: #fee2e2;
          border: 1px solid #dc2626;
          color: #991b1b;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-message {
          font-size: 14px;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background-color: transparent;
          cursor: pointer;
          border-radius: 4px;
          opacity: 0.7;
          transition: opacity 0.2s, background-color 0.2s;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .toast-close:hover {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.1);
        }

        .toast-success .toast-close {
          color: #166534;
        }

        .toast-error .toast-close {
          color: #991b1b;
        }
      `}</style>
    </div>
  );
};

export default Toast;
