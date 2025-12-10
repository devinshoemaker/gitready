import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Notification } from '../../../src/renderer/components/Notification';
import { useUIStore } from '../../../src/renderer/stores/ui.store';

describe('Notification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({ notification: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when no notification', () => {
    const { container } = render(<Notification />);

    expect(container.firstChild).toBeNull();
  });

  it('should render success notification', () => {
    useUIStore.setState({
      notification: { type: 'success', message: 'Operation successful' },
    });

    render(<Notification />);

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render error notification', () => {
    useUIStore.setState({
      notification: { type: 'error', message: 'Something went wrong' },
    });

    render(<Notification />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render info notification', () => {
    useUIStore.setState({
      notification: { type: 'info', message: 'FYI' },
    });

    render(<Notification />);

    expect(screen.getByText('FYI')).toBeInTheDocument();
  });

  it('should auto-dismiss after 5 seconds', () => {
    useUIStore.setState({
      notification: { type: 'success', message: 'Test' },
    });

    render(<Notification />);

    expect(screen.getByText('Test')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(useUIStore.getState().notification).toBeNull();
  });

  it('should dismiss when close button is clicked', () => {
    useUIStore.setState({
      notification: { type: 'success', message: 'Test' },
    });

    render(<Notification />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(useUIStore.getState().notification).toBeNull();
  });

  it('should display correct icon for success', () => {
    useUIStore.setState({
      notification: { type: 'success', message: 'Success!' },
    });

    const { container } = render(<Notification />);

    // Success icon should have green color class
    const svg = container.querySelector('svg.text-green-400');
    expect(svg).toBeInTheDocument();
  });

  it('should display correct icon for error', () => {
    useUIStore.setState({
      notification: { type: 'error', message: 'Error!' },
    });

    const { container } = render(<Notification />);

    // Error icon should have red color class
    const svg = container.querySelector('svg.text-red-400');
    expect(svg).toBeInTheDocument();
  });

  it('should display correct icon for info', () => {
    useUIStore.setState({
      notification: { type: 'info', message: 'Info!' },
    });

    const { container } = render(<Notification />);

    // Info icon should have blue color class
    const svg = container.querySelector('svg.text-blue-400');
    expect(svg).toBeInTheDocument();
  });
});

