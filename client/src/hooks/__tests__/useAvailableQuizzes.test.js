import { renderHook, act, waitFor } from '@testing-library/react';
import { useAvailableQuizzes } from '../useAvailableQuizzes';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useAvailableQuizzes Hook', () => {
  const mockToken = 'mock-jwt-token';
  const mockQuizzes = [
    {
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Quiz 1',
      moduleCode: 'CS101',
      startTime: '2025-01-01T10:00:00.000Z',
      endTime: '2025-12-31T23:59:59.000Z',
      duration: 60
    },
    {
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Quiz 2',
      moduleCode: 'CS102',
      startTime: '2025-01-01T10:00:00.000Z',
      endTime: '2025-12-31T23:59:59.000Z',
      duration: 90
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    fetch.mockClear();
  });

  test('fetches available quizzes successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuizzes
    });

    const { result } = renderHook(() => useAvailableQuizzes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.availableQuizzes).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableQuizzes).toEqual(mockQuizzes);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/quizzes/eligible'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`
        })
      })
    );
  });

  test('handles fetch error gracefully', async () => {
    const errorMessage = 'Network error';
    fetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAvailableQuizzes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableQuizzes).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  test('handles API error response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    const { result } = renderHook(() => useAvailableQuizzes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableQuizzes).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch available quizzes');
  });

  test('refetch functionality works correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuizzes
    });

    const { result } = renderHook(() => useAvailableQuizzes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock new data for refetch
    const newQuizzes = [...mockQuizzes, {
      _id: '507f1f77bcf86cd799439013',
      title: 'Test Quiz 3',
      moduleCode: 'CS103',
      startTime: '2025-01-01T10:00:00.000Z',
      endTime: '2025-12-31T23:59:59.000Z',
      duration: 45
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newQuizzes
    });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableQuizzes).toEqual(newQuizzes);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('handles missing token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAvailableQuizzes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableQuizzes).toEqual([]);
    expect(result.current.error).toBe('No authentication token found');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('automatic refetch on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuizzes
    });

    renderHook(() => useAvailableQuizzes());

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('debounces multiple rapid refetch calls', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockQuizzes
    });

    const { result } = renderHook(() => useAvailableQuizzes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Make multiple rapid refetch calls
    act(() => {
      result.current.refetch();
      result.current.refetch();
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only make 2 calls total (initial + one debounced refetch)
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
