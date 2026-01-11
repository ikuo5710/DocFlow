import React, { useCallback, useRef, useEffect } from 'react';

interface SplitterProps {
  onResize: (ratio: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Splitter: React.FC<SplitterProps> = ({ onResize, containerRef }) => {
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
      onResize(clampedRatio);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Cleanup: reset cursor and userSelect in case component unmounts while dragging
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      isDraggingRef.current = false;
    };
  }, [onResize, containerRef]);

  return (
    <div className="splitter" onMouseDown={handleMouseDown}>
      <div className="splitter-handle" />
      <style>{`
        .splitter {
          width: 8px;
          background-color: #e5e7eb;
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background-color 0.2s;
        }

        .splitter:hover {
          background-color: #d1d5db;
        }

        .splitter-handle {
          width: 4px;
          height: 40px;
          background-color: #9ca3af;
          border-radius: 2px;
        }

        .splitter:hover .splitter-handle {
          background-color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Splitter;
