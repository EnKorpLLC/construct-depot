import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SystemMetricsWidget from '@/components/admin/super/SystemMetricsWidget';
import { useWebSocket } from '@/hooks/useWebSocket';
import { mockMetrics } from '@/lib/test/mocks/metrics';

// Mock the useWebSocket hook
jest.mock('@/hooks/useWebSocket');
const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SystemMetricsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetrics)
      })
    );
  });

  it('shows loading state initially', () => {
    render(<SystemMetricsWidget />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('fetches and displays initial metrics data', async () => {
    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    expect(screen.getByText(`${mockMetrics.cpuUsage}%`)).toBeInTheDocument();
    expect(screen.getByText(`${mockMetrics.memoryUsage}%`)).toBeInTheDocument();
    expect(screen.getByText(`${mockMetrics.diskUsage}%`)).toBeInTheDocument();
  });

  it('updates metrics when receiving WebSocket messages', async () => {
    let websocketCallback: (data: any) => void = () => {};
    mockUseWebSocket.mockImplementation((type, callback) => {
      websocketCallback = callback;
      return { sendMessage: jest.fn() };
    });

    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    const updatedMetrics = {
      ...mockMetrics,
      cpuUsage: 75,
      memoryUsage: 80,
      diskUsage: 90
    };

    act(() => {
      websocketCallback(updatedMetrics);
    });

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('handles WebSocket errors gracefully', async () => {
    mockUseWebSocket.mockImplementation((type, callback) => {
      throw new Error('WebSocket connection failed');
    });

    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    // Should still show initial metrics even if WebSocket fails
    expect(screen.getByText(`${mockMetrics.cpuUsage}%`)).toBeInTheDocument();
  });

  it('displays service status with correct colors', async () => {
    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    mockMetrics.servicesStatus.forEach(service => {
      const statusElement = screen.getByText(service.name)
        .parentElement?.querySelector(`[class*="text-${
          service.status === 'healthy' ? 'green' :
          service.status === 'degraded' ? 'yellow' :
          'red'
        }"]`);
      expect(statusElement).toBeInTheDocument();
    });
  });

  it('formats numbers correctly', async () => {
    const metricsWithLargeNumbers = {
      ...mockMetrics,
      activeUsers: 1234567,
      requestsPerMinute: 9876543
    };

    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(metricsWithLargeNumbers)
      })
    );

    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('9,876,543')).toBeInTheDocument();
    });
  });
}); 