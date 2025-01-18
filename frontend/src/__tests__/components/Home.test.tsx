import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /bulk buyer group/i });
    expect(heading).toBeInTheDocument();
  });
}); 