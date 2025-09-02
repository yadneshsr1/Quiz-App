import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentHeader from "../components/StudentHeader";
import "./QuizTaking.css";

const QuizTaking = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;

    setIsSubmitted(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/results/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: quiz._id,
          answers,
          timeSpent: timeSpent,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Quiz already submitted - redirect to results
          alert(
            "You have already submitted this quiz. Redirecting to your results..."
          );
          
          // Calculate score for already submitted quiz
          let correctAnswers = 0;
          let totalQuestions = quiz.questions.length;
          
          quiz.questions.forEach(question => {
            const userAnswer = answers[question._id];
            if (userAnswer !== undefined && userAnswer === question.correctAnswerIndex) {
              correctAnswers++;
            }
          });
          
          const score = Math.round((correctAnswers / totalQuestions) * 100);
          
          navigate(`/quiz-results/${quiz._id}`, {
            state: {
              score: score,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              timeSpent: timeSpent,
              answers: answers,
              alreadySubmitted: true
            },
          });
          return;
        }
        throw new Error(errorData.error || "Failed to submit quiz");
      }

      const result = await response.json();

      // Calculate score locally to ensure accuracy
      let correctAnswers = 0;
      let totalQuestions = quiz.questions.length;
      
      quiz.questions.forEach(question => {
        const userAnswer = answers[question._id];
        if (userAnswer !== undefined && userAnswer === question.correctAnswerIndex) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Navigate to results page
      navigate(`/quiz-results/${quiz._id}`, {
        state: {
          score: score,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          timeSpent: timeSpent,
          answers: answers,
        },
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      if (error.message === "Quiz already submitted") {
        alert(
          "You have already submitted this quiz. Redirecting to your results..."
        );
        
        // Calculate score for already submitted quiz
        let correctAnswers = 0;
        let totalQuestions = quiz.questions.length;
        
        quiz.questions.forEach(question => {
          const userAnswer = answers[question._id];
          if (userAnswer !== undefined && userAnswer === question.correctAnswerIndex) {
            correctAnswers++;
          }
        });
        
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        
        navigate(`/quiz-results/${quiz._id}`, {
          state: {
            score: score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            timeSpent: timeSpent,
            answers: answers,
            alreadySubmitted: true
          },
        });
      } else {
        alert("Error submitting quiz: " + error.message);
        setIsSubmitted(false);
      }
    }
  }, [quiz, answers, timeLeft, navigate, timeSpent]);

  useEffect(() => {
    // Check authentication
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || userData.role !== "student") {
      navigate("/login");
      return;
    }

    // Set user data for header component
    setUserData(userData);

    // Load quiz data from API
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log(`Fetching quiz with ID: ${quizId}`);

        const response = await fetch(
          `/api/quizzes/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(`Quiz fetch response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Quiz fetch failed:", errorText);
          throw new Error(
            `Failed to fetch quiz: ${response.status} ${errorText}`
          );
        }

        const quizData = await response.json();

        // Validate quiz data
        if (!quizData || !quizData.questions) {
          console.error("Invalid quiz data received:", quizData);
          throw new Error("Invalid quiz data: Quiz or questions are missing");
        }

        // Log the received data
        console.log("Quiz data received:", {
          id: quizData._id,
          title: quizData.title,
          questionsCount: quizData.questions?.length || 0,
          questions: quizData.questions?.map((q) => ({
            id: q._id,
            text: q.questionText,
          })),
        });

        if (quizData.questions.length === 0) {
          console.warn("Quiz has no questions");
        }

        setQuiz(quizData);
        setTimeLeft((quizData.duration || 60) * 60); // Convert to seconds
      } catch (error) {
        console.error("Error fetching quiz:", error);
        throw error; // Let the error propagate up
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
        // Update time spent
        setTimeSpent(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  const handleAnswerSelect = (questionId, answerIndex) => {
    console.log(
      `Answer selected: Question ${questionId}, Answer ${answerIndex}`
    );
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
    // Show feedback immediately when answer is selected
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getQuestionStatus = (questionIndex) => {
    const question = quiz.questions[questionIndex];
    const hasAnswer = answers[question._id] !== undefined;
    return hasAnswer ? "answered" : "unanswered";
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>
          {!quiz ? "Quiz not found" : "No questions available in this quiz"}
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Question not found
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Student Header */}
      <StudentHeader userData={userData} />
      
      {/* Main Content */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar - Question Navigation */}
      <div
        style={{
          width: "300px",
          backgroundColor: "white",
          padding: "20px",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Questions
          </h3>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            {quiz.questions.length} total
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {quiz.questions.map((question, index) => (
            <button
              key={question._id}
              onClick={() => setCurrentQuestionIndex(index)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                backgroundColor:
                  currentQuestionIndex === index
                    ? "#6366f1"
                    : getQuestionStatus(index) === "answered"
                    ? "#10b981"
                    : "#f3f4f6",
                color:
                  currentQuestionIndex === index
                    ? "white"
                    : getQuestionStatus(index) === "answered"
                    ? "white"
                    : "#6b7280",
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
              }}
            ></div>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Answered
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "50%",
              }}
            ></div>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Unanswered
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitted(true)}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Submit Quiz
        </button>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          padding: "30px",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              {quiz.title}
            </h1>
            <div
              style={{
                fontSize: "1rem",
                color: "#6b7280",
              }}
            >
              Module: {quiz.moduleCode} • Question {currentQuestionIndex + 1} of{" "}
              {quiz.questions.length}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: timeLeft < 300 ? "#ef4444" : "#6366f1",
                color: "white",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "bold",
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            {currentQuestion.questionText}
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  border: "2px solid",
                  borderColor:
                    answers[currentQuestion._id] === index
                      ? "#6366f1"
                      : "#e5e7eb",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor:
                    answers[currentQuestion._id] === index
                      ? "#f0f9ff"
                      : "white",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={answers[currentQuestion._id] === index}
                  onChange={() =>
                    handleAnswerSelect(currentQuestion._id, index)
                  }
                  style={{
                    marginRight: "12px",
                    transform: "scale(1.2)",
                  }}
                />
                <span
                  style={{
                    fontSize: "1rem",
                    color: "#1f2937",
                  }}
                >
                  {option}
                </span>
              </label>
            ))}
          </div>


        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: "12px 24px",
              backgroundColor:
                currentQuestionIndex === 0 ? "#f3f4f6" : "#6366f1",
              color: currentQuestionIndex === 0 ? "#9ca3af" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            {Object.keys(answers).length} of {quiz.questions.length} answered
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === quiz.questions.length - 1}
            style={{
              padding: "12px 24px",
              backgroundColor:
                currentQuestionIndex === quiz.questions.length - 1
                  ? "#f3f4f6"
                  : "#6366f1",
              color:
                currentQuestionIndex === quiz.questions.length - 1
                  ? "#9ca3af"
                  : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor:
                currentQuestionIndex === quiz.questions.length - 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
      </div>

      {/* Confirmation Modal */}
      {isSubmitted && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px",
              }}
            >
              Quiz Submitted!
            </h3>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Your quiz has been submitted. You can view your results on the
              results page.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
                             <button
                 onClick={() => {
                   // Calculate score for the modal navigation
                   let correctAnswers = 0;
                   let totalQuestions = quiz.questions.length;
                   
                   quiz.questions.forEach(question => {
                     const userAnswer = answers[question._id];
                     if (userAnswer !== undefined && userAnswer === question.correctAnswerIndex) {
                       correctAnswers++;
                     }
                   });
                   
                   const score = Math.round((correctAnswers / totalQuestions) * 100);
                   
                   navigate(`/quiz-results/${quiz._id}`, {
                     state: {
                       score: score,
                       totalQuestions: totalQuestions,
                       correctAnswers: correctAnswers,
                       timeSpent: timeSpent,
                       answers: answers,
                     },
                   });
                 }}
                 style={{
                   padding: "10px 20px",
                   backgroundColor: "#f3f4f6",
                   color: "#6b7280",
                   border: "none",
                   borderRadius: "6px",
                   fontSize: "0.875rem",
                   fontWeight: "600",
                   cursor: "pointer",
                 }}
               >
                 View Results
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;
