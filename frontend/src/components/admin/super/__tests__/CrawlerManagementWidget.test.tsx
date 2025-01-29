import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CrawlerManagementWidget from '../CrawlerManagementWidget';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock crawler jobs data
const mockJobs = [
  {
    id: '1',
    name: 'Supplier A Products',
    status: 'running',
    progress: 45,
    lastRun: '2025-01-11 10:00',
    nextRun: '2025-01-11 16:00',
    targetUrl: 'https://supplier-a.com/products',
    itemsProcessed: 1234
  },
  {
    id: '2',
    name: 'Supplier B Inventory',
    status: 'paused',
    progress: 75,
    lastRun: '2025-01-11 09:00',
    nextRun: '2025-01-11 15:00',
    targetUrl: 'https://supplier-b.com/inventory',
    itemsProcessed: 2345
  },
  {
    id: '3',
    name: 'Supplier C Catalog',
    status: 'completed',
    progress: 100,
    lastRun: '2025-01-11 08:00',
    nextRun: '2025-01-11 14:00',
    targetUrl: 'https://supplier-c.com/catalog',
    itemsProcessed: 3456
  }
];

describe('CrawlerManagementWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJobs)
      })
    );
  });

  it('shows loading state initially', () => {
    render(<CrawlerManagementWidget />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('fetches and displays crawler jobs', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    // Check if all jobs are displayed
    expect(screen.getByText('Supplier A Products')).toBeInTheDocument();
    expect(screen.getByText('https://supplier-b.com/inventory')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays correct status colors', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    const runningStatus = screen.getByText('Running');
    const pausedStatus = screen.getByText('Paused');
    const completedStatus = screen.getByText('Completed');

    expect(runningStatus).toHaveClass('text-green-500');
    expect(pausedStatus).toHaveClass('text-yellow-500');
    expect(completedStatus).toHaveClass('text-blue-500');
  });

  it('handles job actions correctly', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    // Test pause action
    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/crawler/jobs/1/pause',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Test start action
    const startButton = screen.getByTitle('Start');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/crawler/jobs/2/start',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Test restart action
    const restartButton = screen.getAllByTitle('Restart')[0];
    fireEvent.click(restartButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/crawler/jobs/1/restart',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch crawler jobs')).toBeInTheDocument();
    });
  });

  it('shows error when job action fails', async () => {
    mockFetch
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockJobs)
        })
      )
      .mockImplementationOnce(() => 
        Promise.reject(new Error('Failed to pause job'))
      );

    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to pause job')).toBeInTheDocument();
    });
  });

  it('displays progress bars correctly', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars[0]).toHaveStyle({ width: '45%' });
    expect(progressBars[1]).toHaveStyle({ width: '75%' });
    expect(progressBars[2]).toHaveStyle({ width: '100%' });
  });

  it('displays empty state when no jobs exist', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('No crawler jobs found. Create a new one to get started.')).toBeInTheDocument();
    });
  });

  it('links to new crawler page', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('New Crawler')).toBeInTheDocument();
    });

    const newCrawlerLink = screen.getByText('New Crawler');
    expect(newCrawlerLink.closest('a')).toHaveAttribute('href', '/admin/crawler/new');
  });

  it('formats numbers correctly', async () => {
    render(<CrawlerManagementWidget />);

    await waitFor(() => {
      expect(screen.getByText('Crawler Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Items: 1,234')).toBeInTheDocument();
    expect(screen.getByText('Items: 2,345')).toBeInTheDocument();
    expect(screen.getByText('Items: 3,456')).toBeInTheDocument();
  });
}); 