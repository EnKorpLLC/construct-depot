import { render, screen, waitFor } from '@testing-library/react';
import SystemMetricsWidget from '../SystemMetricsWidget';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock metrics data
const mockMetrics = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 75,
  activeUsers: 1234,
  requestsPerMinute: 500,
  averageResponseTime: 150,
  errorRate: 0.5,
  uptime: '99.9%',
  lastDeployment: '2025-01-11 12:00',
  servicesStatus: [
    { name: 'API Server', status: 'healthy', latency: 50 },
    { name: 'Database', status: 'healthy', latency: 30 },
    { name: 'Cache', status: 'degraded', latency: 100 },
    { name: 'Search', status: 'down', latency: 500 }
  ]
};

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

  it('fetches and displays metrics data', async () => {
    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    // Check resource usage metrics
    expect(screen.getByText('45%')).toBeInTheDocument(); // CPU Usage
    expect(screen.getByText('60%')).toBeInTheDocument(); // Memory Usage
    expect(screen.getByText('75%')).toBeInTheDocument(); // Disk Usage
    expect(screen.getByText('1,234')).toBeInTheDocument(); // Active Users

    // Check performance metrics
    expect(screen.getByText('500')).toBeInTheDocument(); // Requests/min
    expect(screen.getByText('150ms')).toBeInTheDocument(); // Avg Response Time
    expect(screen.getByText('0.5%')).toBeInTheDocument(); // Error Rate
    expect(screen.getByText('99.9%')).toBeInTheDocument(); // Uptime

    // Check services status
    expect(screen.getByText('API Server')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Cache')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('displays correct status colors for services', async () => {
    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    const healthyService = screen.getByText('API Server').parentElement;
    const degradedService = screen.getByText('Cache').parentElement;
    const downService = screen.getByText('Search').parentElement;

    expect(healthyService).toHaveTextContent('Healthy');
    expect(degradedService).toHaveTextContent('Degraded');
    expect(downService).toHaveTextContent('Down');

    expect(healthyService?.querySelector('.text-green-500')).toBeTruthy();
    expect(degradedService?.querySelector('.text-yellow-500')).toBeTruthy();
    expect(downService?.querySelector('.text-red-500')).toBeTruthy();
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch system metrics')).toBeInTheDocument();
    });
  });

  it('updates metrics periodically', async () => {
    jest.useFakeTimers();

    const updatedMetrics = {
      ...mockMetrics,
      cpuUsage: 55,
      activeUsers: 1500
    };

    mockFetch
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics)
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedMetrics)
        })
      );

    render(<SystemMetricsWidget />);

    // Initial render
    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    // Check updated values
    await waitFor(() => {
      expect(screen.getByText('55%')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('formats numbers correctly', async () => {
    const metricsWithLargeNumbers = {
      ...mockMetrics,
      activeUsers: 1234567,
      requestsPerMinute: 1000000
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
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });
  });

  it('displays progress bars with correct widths', async () => {
    render(<SystemMetricsWidget />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });

    const cpuBar = screen.getByTestId('cpu-progress');
    const memoryBar = screen.getByTestId('memory-progress');
    const diskBar = screen.getByTestId('disk-progress');

    expect(cpuBar).toHaveStyle({ width: '45%' });
    expect(memoryBar).toHaveStyle({ width: '60%' });
    expect(diskBar).toHaveStyle({ width: '75%' });
  });
}); 