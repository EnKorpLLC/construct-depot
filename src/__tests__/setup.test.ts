import { render } from './utils/test-utils';
import { generateUser, generateApiResponse } from './mocks/data-generators';
import { mockFetch } from './utils/test-utils';

describe('Testing Infrastructure', () => {
  it('should have working test utilities', () => {
    const mockUser = generateUser();
    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('email');
    expect(mockUser).toHaveProperty('name');
  });

  it('should have working API mocks', async () => {
    const mockData = generateUser();
    mockFetch(generateApiResponse(mockData));

    const response = await fetch('/api/test');
    const json = await response.json();
    
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('should have working localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });

  it('should have working matchMedia mock', () => {
    expect(window.matchMedia).toBeDefined();
    const mql = window.matchMedia('(min-width: 768px)');
    expect(mql.matches).toBeDefined();
  });
}); 