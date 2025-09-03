/**
 * Custom hook for quiz submission with proper cache invalidation
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useQuizSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  const submitQuiz = useCallback(async (quizData) => {
    const { quiz, answers, timeSpent } = quizData;
    
    if (isSubmitting) {
      console.warn('Quiz submission already in progress');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem("token");
      
      console.log('🚀 Submitting quiz:', {
        quizId: quiz._id,
        answersCount: Object.keys(answers).length,
        timeSpent
      });

      const response = await fetch(`/api/results/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: quiz._id,
          answers,
          timeSpent: timeSpent || 0,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Quiz already submitted
          console.log('⚠️ Quiz already submitted, handling gracefully');
          setSubmitError("Quiz already submitted");
          
          // Still navigate to results with calculated score
          const { score, correctAnswers, totalQuestions } = calculateScore(quiz, answers);
          
          navigate(`/quiz-results/${quiz._id}`, {
            state: {
              score,
              totalQuestions,
              correctAnswers,
              timeSpent: timeSpent || 0,
              answers,
              alreadySubmitted: true
            },
          });
          return;
        }
        
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      console.log('✅ Quiz submitted successfully:', responseData.result);

      // Calculate score for navigation
      const { score, correctAnswers, totalQuestions } = calculateScore(quiz, answers);
      console.log('📊 Calculated score:', { score, correctAnswers, totalQuestions });

      // CRITICAL: Invalidate available quizzes cache
      // This ensures the dashboard will refetch and exclude this quiz
      console.log('🔄 Dispatching cache invalidation event...');
      window.dispatchEvent(new Event('quizCacheInvalidate'));
      console.log('✅ Cache invalidation event dispatched');

      // Navigate to results
      navigate(`/quiz-results/${quiz._id}`, {
        state: {
          score,
          totalQuestions,
          correctAnswers,
          timeSpent: timeSpent || 0,
          answers,
          submissionId: responseData.result._id
        },
        // Force replace to prevent back navigation to quiz
        replace: true
      });

    } catch (error) {
      console.error('❌ Quiz submission failed:', error);
      setSubmitError(error.message);
      
      // Don't navigate on error, let user retry
      alert(`Failed to submit quiz: ${error.message}`);
      
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, navigate]);

  return {
    submitQuiz,
    isSubmitting,
    submitError
  };
};

/**
 * Calculate quiz score from answers
 */
function calculateScore(quiz, answers) {
  let correctAnswers = 0;
  const totalQuestions = quiz.questions ? quiz.questions.length : 0;
  
  if (quiz.questions) {
    quiz.questions.forEach(question => {
      const userAnswer = answers[question._id];
      if (userAnswer !== undefined && userAnswer === question.correctAnswerIndex) {
        correctAnswers++;
      }
    });
  }
  
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  return { score, correctAnswers, totalQuestions };
}
