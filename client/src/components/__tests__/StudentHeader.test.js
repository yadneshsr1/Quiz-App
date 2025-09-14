import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentHeader from '../StudentHeader';
import '@testing-library/jest-dom';

// Mock the hooks and dependencies
jest.mock('../../hooks/useStudentPhoto', () => ({
  useStudentPhoto: () => ({
    photoUrl: null,
    isLoading: false,
    error: null
  })
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('StudentHeader Component', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    regNo: 'ST001',
    email: 'john@test.com'
  };

  const mockQuiz = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Quiz',
    moduleCode: 'CS101',
    duration: 60
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
  });

  test('renders header with user information', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ST001')).toBeInTheDocument();
  });

  test('displays quiz information when provided', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });

  test('formats time correctly', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3661} // 1 hour, 1 minute, 1 second
      />
    );

    expect(screen.getByText(/01:01:01/)).toBeInTheDocument();
  });

  test('shows warning when time is running low', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={300} // 5 minutes
      />
    );

    const timerElement = screen.getByText(/00:05:00/);
    expect(timerElement).toHaveClass('warning');
  });

  test('shows critical warning when time is very low', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={60} // 1 minute
      />
    );

    const timerElement = screen.getByText(/00:01:00/);
    expect(timerElement).toHaveClass('critical');
  });

  test('handles logout functionality', async () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays photo when available', () => {
    // Mock photo hook to return photo URL
    jest.doMock('../../hooks/useStudentPhoto', () => ({
      useStudentPhoto: () => ({
        photoUrl: 'https://example.com/photo.jpg',
        isLoading: false,
        error: null
      })
    }));

    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    const photoElement = screen.getByAltText('Student Photo');
    expect(photoElement).toBeInTheDocument();
    expect(photoElement).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  test('shows initials fallback when photo unavailable', () => {
    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('handles missing user gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderWithRouter(
      <StudentHeader 
        user={null} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    expect(screen.getByText('Guest User')).toBeInTheDocument();
  });

  test('responsive behavior on mobile', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    renderWithRouter(
      <StudentHeader 
        user={mockUser} 
        quiz={mockQuiz} 
        timeLeft={3600} 
      />
    );

    // Check that mobile-specific classes are applied
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('mobile');
  });
});
