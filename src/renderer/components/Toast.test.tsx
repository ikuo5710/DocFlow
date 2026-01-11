/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('visibility', () => {
    it('should render when visible is true', () => {
      render(
        <Toast
          message="Test message"
          type="success"
          visible={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByTestId('toast')).toBeDefined();
      expect(screen.getByText('Test message')).toBeDefined();
    });

    it('should not render when visible is false', () => {
      render(
        <Toast
          message="Test message"
          type="success"
          visible={false}
          onClose={() => {}}
        />
      );

      expect(screen.queryByTestId('toast')).toBeNull();
    });
  });

  describe('type styles', () => {
    it('should have success class when type is success', () => {
      render(
        <Toast
          message="Success message"
          type="success"
          visible={true}
          onClose={() => {}}
        />
      );

      const toast = screen.getByTestId('toast');
      expect(toast.classList.contains('toast-success')).toBe(true);
    });

    it('should have error class when type is error', () => {
      render(
        <Toast
          message="Error message"
          type="error"
          visible={true}
          onClose={() => {}}
        />
      );

      const toast = screen.getByTestId('toast');
      expect(toast.classList.contains('toast-error')).toBe(true);
    });
  });

  describe('close behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();

      render(
        <Toast
          message="Test message"
          type="success"
          visible={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-close success toast after default duration (3000ms)', async () => {
      const onClose = vi.fn();

      render(
        <Toast
          message="Success message"
          type="success"
          visible={true}
          onClose={onClose}
        />
      );

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-close success toast after custom duration', async () => {
      const onClose = vi.fn();

      render(
        <Toast
          message="Success message"
          type="success"
          visible={true}
          onClose={onClose}
          autoCloseDuration={5000}
        />
      );

      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT auto-close error toast', () => {
      const onClose = vi.fn();

      render(
        <Toast
          message="Error message"
          type="error"
          visible={true}
          onClose={onClose}
        />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not auto-close when autoCloseDuration is 0', () => {
      const onClose = vi.fn();

      render(
        <Toast
          message="Success message"
          type="success"
          visible={true}
          onClose={onClose}
          autoCloseDuration={0}
        />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <Toast
          message="Test message"
          type="success"
          visible={true}
          onClose={() => {}}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toBeDefined();
    });

    it('should have aria-live="polite"', () => {
      render(
        <Toast
          message="Test message"
          type="success"
          visible={true}
          onClose={() => {}}
        />
      );

      const toast = screen.getByTestId('toast');
      expect(toast.getAttribute('aria-live')).toBe('polite');
    });

    it('close button should have accessible label', () => {
      render(
        <Toast
          message="Test message"
          type="success"
          visible={true}
          onClose={() => {}}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeDefined();
    });
  });
});
