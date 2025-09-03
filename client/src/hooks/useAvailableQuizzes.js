/**
 * Custom hook for managing available quizzes with cache invalidation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAvailableQuizzes = () => {
  const navigate = useNavigate();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchTime = useRef(0);
  const isMounted = useRef(true);

  const fetchQuizzes = useCallback(async (force = false) => {
    // Prevent duplicate fetches within 2 seconds unless forced
    const now = Date.now();
    if (!force && (now - lastFetchTime.current) < 2000) {
      console.log('🔄 Skipping duplicate fetch (too recent)');
      return;
    }

    if (!isMounted.current) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      console.log('🔄 Fetching available quizzes...');
      
      const response = await fetch(`/api/quizzes/eligible`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(`Failed to fetch quizzes: ${response.status}`);
      }

      const quizzes = await response.json();
      
      if (isMounted.current) {
        console.log(`✅ Fetched ${quizzes.length} available quizzes`);
        setAvailableQuizzes(quizzes);
        lastFetchTime.current = now;
      }
      
    } catch (err) {
      if (isMounted.current) {
        console.error("❌ Error fetching quizzes:", err);
        setError(err.message);
        setAvailableQuizzes([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [navigate]);

  // Initial fetch on mount
  useEffect(() => {
    isMounted.current = true;
    fetchQuizzes();

    return () => {
      isMounted.current = false;
    };
  }, [fetchQuizzes]);

  // Listen for cache invalidation events (triggered after quiz submission)
  useEffect(() => {
    const handleCacheInvalidation = () => {
      if (isMounted.current) {
        console.log('🔄 Cache invalidation event received - refetching quizzes');
        lastFetchTime.current = 0; // Reset throttle
        fetchQuizzes(true);
      }
    };

    window.addEventListener('quizCacheInvalidate', handleCacheInvalidation);

    return () => {
      window.removeEventListener('quizCacheInvalidate', handleCacheInvalidation);
    };
  }, [fetchQuizzes]);

  const refetch = useCallback(() => {
    lastFetchTime.current = 0; // Reset throttle
    fetchQuizzes(true);
  }, [fetchQuizzes]);

  return {
    availableQuizzes,
    isLoading,
    error,
    refetch
  };
};
