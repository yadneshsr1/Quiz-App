import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { CONFIG } from "../config";
import "./QuizResults.css";

const QuizResults = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock quiz data with proper ObjectIds (fallback only)
  const mockQuiz = {
    _id: quizId,
    title: "Introduction to Computer Science",
    moduleCode: "CS101",
    duration: 60,
    totalQuestions: 5,
    questions: [
      {
        _id: "mock-question-1",
        questionText: "What is the primary purpose of an algorithm?",
        options: [
          "To solve a specific problem efficiently",
          "To make code more readable",
          "To reduce file size",
          "To improve computer performance"
        ],
        correctAnswerIndex: 0,
        feedback: "Algorithms are step-by-step procedures designed to solve specific problems efficiently. They provide a systematic approach to problem-solving and are fundamental to computer science."
      },
      {
        _id: "mock-question-2",
        questionText: "Which data structure operates on a LIFO basis?",
        options: [
          "Queue",
          "Stack",
          "Tree",
          "Graph"
        ],
        correctAnswerIndex: 1,
        feedback: "A Stack operates on LIFO (Last In, First Out) principle. The last element added to the stack is the first one to be removed, like a stack of plates."
      },
      {
        _id: "mock-question-3",
        questionText: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlink and Text Markup Language"
        ],
        correctAnswerIndex: 0
      },
      {
        _id: "mock-question-4",
        questionText: "Which programming paradigm focuses on objects?",
        options: [
          "Procedural programming",
          "Object-oriented programming",
          "Functional programming",
          "Logical programming"
        ],
        correctAnswerIndex: 1
      },
      {
        _id: "mock-question-5",
        questionText: "What is the time complexity of binary search?",
        options: [
          "O(n)",
          "O(log n)",
          "O(n²)",
          "O(1)"
        ],
        correctAnswerIndex: 1
      }
    ]
  };

  useEffect(() => {
    console.log("QuizResults component mounted with quizId:", quizId);
    console.log("Location state:", location.state);
    
    // Check authentication
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || userData.role !== "student") {
      navigate("/login");
      return;
    }

    // Get results from location state
    const locationResults = location.state;
    if (locationResults) {
      setResults(locationResults);
    } else {
      // If no results in location state, redirect back to student dashboard
      console.log("No results in location state, redirecting to dashboard...");
      navigate("/student");
      return;
    }

    // Fetch quiz data from API
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log(`Fetching quiz for results: ${quizId}`);
        
        // Temporarily hardcode the correct endpoint for testing
      const response = await fetch(`/api/quizzes/${quizId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error("Failed to fetch quiz for results");
          // Fallback to mock data
          setQuiz(mockQuiz);
          setIsLoading(false);
          return;
        }

        const quizData = await response.json();
        console.log("Quiz data for results:", {
          id: quizData._id,
          title: quizData.title,
          questionsCount: quizData.questions?.length || 0,
          questions: quizData.questions
        });
        
        setQuiz(quizData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching quiz for results:", error);
        // Fallback to mock data
        setQuiz(mockQuiz);
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, location.state]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#10b981"; // Green
    if (score >= 80) return "#3b82f6"; // Blue
    if (score >= 70) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return "Excellent!";
    if (score >= 80) return "Good job!";
    if (score >= 70) return "Well done!";
    if (score >= 60) return "Keep practicing!";
    return "Need more practice!";
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>Loading Results...</div>
      </div>
    );
  }

  if (!results || !quiz) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>Results not found</div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      
      {/* Left Sidebar - Summary */}
      <div style={{
        width: "350px",
        backgroundColor: "white",
        padding: "30px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        overflowY: "auto"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "30px"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "8px"
          }}>
            Quiz Results
          </h2>
          <div style={{
            fontSize: "1rem",
            color: "#6b7280"
          }}>
            {quiz.title}
          </div>
        </div>

        {/* Score Display */}
        <div style={{
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          marginBottom: "24px"
        }}>
          <div style={{
            fontSize: "3rem",
            fontWeight: "bold",
            color: getScoreColor(results.score),
            marginBottom: "8px"
          }}>
            {results.score}%
          </div>
          <div style={{
            fontSize: "1.125rem",
            color: "#6b7280",
            marginBottom: "16px"
          }}>
            {getScoreMessage(results.score)}
          </div>
          <div style={{
            fontSize: "0.875rem",
            color: "#6b7280"
          }}>
            {results.correctAnswers} out of {results.totalQuestions} correct
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            backgroundColor: "#fef3c7",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#f59e0b",
              marginBottom: "4px"
            }}>
              {results.correctAnswers}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#92400e"
            }}>
              Correct
            </div>
          </div>
          
          <div style={{
            backgroundColor: "#fee2e2",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#ef4444",
              marginBottom: "4px"
            }}>
              {results.totalQuestions - results.correctAnswers}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#991b1b"
            }}>
              Incorrect
            </div>
          </div>
        </div>

        {/* Time Taken */}
        <div style={{
          backgroundColor: "#dbeafe",
          padding: "16px",
          borderRadius: "8px",
          textAlign: "center",
          marginBottom: "24px"
        }}>
          <div style={{
            fontSize: "1.125rem",
            fontWeight: "bold",
            color: "#1e40af",
            marginBottom: "4px"
          }}>
            {formatTime(results.timeSpent)}
          </div>
          <div style={{
            fontSize: "0.875rem",
            color: "#1e3a8a"
          }}>
            Time Taken
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <button
            onClick={() => navigate("/student")}
            style={{
              padding: "12px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Back to Dashboard
          </button>
          

        </div>
      </div>

      {/* Main Content - Detailed Results */}
      <div style={{
        flex: 1,
        padding: "30px",
        overflowY: "auto"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "24px"
        }}>
          Question Breakdown
        </h2>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {quiz.questions.map((question, index) => {
            const userAnswer = results.answers ? results.answers[question._id] : undefined;
            const isCorrect = userAnswer === question.correctAnswerIndex;
            
            return (
              <div
                key={question._id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  border: `2px solid ${isCorrect ? "#10b981" : "#ef4444"}`
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px"
                }}>
                  <h3 style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#1f2937",
                    margin: 0,
                    flex: 1
                  }}>
                    Question {index + 1}
                  </h3>
                  <div style={{
                    padding: "4px 12px",
                    backgroundColor: isCorrect ? "#d1fae5" : "#fee2e2",
                    color: isCorrect ? "#065f46" : "#991b1b",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600"
                  }}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <p style={{
                  color: "#6b7280",
                  fontSize: "1rem",
                  lineHeight: "1.5",
                  marginBottom: "20px"
                }}>
                  {question.questionText}
                </p>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = userAnswer === optionIndex;
                    const isCorrectAnswer = question.correctAnswerIndex === optionIndex;
                    
                    let backgroundColor = "#f9fafb";
                    let borderColor = "#e5e7eb";
                    let textColor = "#6b7280";
                    
                    if (isCorrectAnswer) {
                      backgroundColor = "#d1fae5";
                      borderColor = "#10b981";
                      textColor = "#065f46";
                    } else if (isUserAnswer && !isCorrect) {
                      backgroundColor = "#fee2e2";
                      borderColor = "#ef4444";
                      textColor = "#991b1b";
                    }

                    return (
                      <div
                        key={optionIndex}
                        style={{
                          padding: "12px 16px",
                          backgroundColor,
                          border: `2px solid ${borderColor}`,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: isCorrectAnswer ? "#10b981" : isUserAnswer && !isCorrect ? "#ef4444" : "#d1d5db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          color: "white"
                        }}>
                          {String.fromCharCode(65 + optionIndex)}
                        </div>
                        <span style={{
                          color: textColor,
                          fontSize: "0.875rem"
                        }}>
                          {option}
                        </span>
                        {isCorrectAnswer && (
                          <span style={{
                            marginLeft: "auto",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            color: "#10b981"
                          }}>
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserAnswer && !isCorrect && (
                          <span style={{
                            marginLeft: "auto",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            color: "#ef4444"
                          }}>
                            ✗ Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Feedback Section */}
                {question.feedback && (
                  <div style={{
                    marginTop: "16px",
                    padding: "16px",
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #0ea5e9",
                    borderRadius: "8px",
                    borderLeft: "4px solid #0ea5e9"
                  }}>
                    <div style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#0369a1",
                      marginBottom: "8px"
                    }}>
                      💡 Feedback & Justification:
                    </div>
                    <div style={{
                      fontSize: "1rem",
                      color: "#0c4a6e",
                      lineHeight: "1.5"
                    }}>
                      {question.feedback}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResults; 