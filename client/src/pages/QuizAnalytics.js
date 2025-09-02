import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { CONFIG } from "../config";
import "./QuizAnalytics.css";

const QuizAnalytics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [questionAnalytics, setQuestionAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOption, setFilterOption] = useState("all"); // all, passed, failed
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || userData.role !== "academic") {
      navigate("/login");
      return;
    }

    fetchAnalytics();
  }, [quizId, navigate]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      // Temporarily hardcode the correct endpoint for testing
      const response = await fetch(
        `/api/results/quiz/${quizId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      
      setQuiz(data.quiz);
      setResults(data.results);
      setSummary(data.summary);
      setQuestionAnalytics(data.questionAnalytics);
      
      console.log("Analytics data loaded:", {
        quiz: data.quiz.title,
        totalSubmissions: data.summary.totalSubmissions,
        averageScore: data.summary.averageScore
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#10b981";
    if (score >= 80) return "#3b82f6";
    if (score >= 70) return "#f59e0b";
    if (score >= 60) return "#f97316";
    return "#ef4444";
  };

  const getStatusColor = (status) => {
    return status === "passed" ? "#10b981" : "#ef4444";
  };

  const filteredResults = results.filter((result) => {
    const matchesFilter = 
      filterOption === "all" ||
      (filterOption === "passed" && result.status === "passed") ||
      (filterOption === "failed" && result.status === "failed");
    
    const matchesSearch = 
      result.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.studentId.regNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleViewResponse = (result) => {
    setSelectedResult(result);
    setShowResponseModal(true);
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
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>Loading Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{ fontSize: "1.5rem", color: "#ef4444" }}>Error: {error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>Quiz not found</div>
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
      
      {/* Left Sidebar - Analytics Summary */}
      <div style={{
        width: "350px",
        backgroundColor: "white",
        padding: "30px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        overflowY: "auto"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#1f2937",
            margin: 0
          }}>
            Quiz Analytics
          </h2>
          <button
            onClick={() => navigate("/academic")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Back
          </button>
        </div>

        {/* Quiz Info */}
        <div style={{
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "8px"
          }}>
            {quiz?.title}
          </h3>
          <div style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginBottom: "16px"
          }}>
            Module: {quiz?.moduleCode} • {quiz?.totalQuestions} Questions • {quiz?.duration} min
          </div>
          <div style={{
            fontSize: "0.875rem",
            color: "#6b7280"
          }}>
            {summary?.totalSubmissions || 0} students attempted
          </div>
        </div>

        {/* Performance Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            backgroundColor: "#dbeafe",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1e40af",
              marginBottom: "4px"
            }}>
              {summary?.averageScore || 0}%
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#1e3a8a"
            }}>
              Average Score
            </div>
          </div>
          
          <div style={{
            backgroundColor: "#d1fae5",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#059669",
              marginBottom: "4px"
            }}>
              {summary?.passRate || 0}%
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#065f46"
            }}>
              Pass Rate
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div style={{
          backgroundColor: "#fef3c7",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <h4 style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#92400e",
            marginBottom: "12px"
          }}>
            Performance Breakdown
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            fontSize: "0.875rem"
          }}>
            <div>
              <span style={{ color: "#92400e" }}>Passed:</span>
              <span style={{ color: "#059669", fontWeight: "600", marginLeft: "8px" }}>
                {summary?.passedStudents || 0}
              </span>
            </div>
            <div>
              <span style={{ color: "#92400e" }}>Failed:</span>
              <span style={{ color: "#ef4444", fontWeight: "600", marginLeft: "8px" }}>
                {summary?.failedStudents || 0}
              </span>
            </div>
            <div>
              <span style={{ color: "#92400e" }}>Avg Time:</span>
              <span style={{ color: "#1e40af", fontWeight: "600", marginLeft: "8px" }}>
                {summary?.averageTime || 0} min
              </span>
            </div>
            <div>
              <span style={{ color: "#92400e" }}>Total:</span>
              <span style={{ color: "#1f2937", fontWeight: "600", marginLeft: "8px" }}>
                {summary?.totalSubmissions || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px"
          }}>
            Filter Results
          </h4>
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem"
            }}
          >
            <option value="all">All Students</option>
            <option value="passed">Passed (≥60%)</option>
            {/* <option value="failed">Failed (<60%)</option> */}
          </select>
        </div>

        {/* Search */}
        <div>
          <h4 style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px"
          }}>
            Search Students
          </h4>
          <input
            type="text"
            placeholder="Search by name or reg number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem"
            }}
          />
        </div>
      </div>

      {/* Main Content - Results Table */}
      <div style={{
        flex: 1,
        padding: "30px",
        overflowY: "auto"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#1f2937"
          }}>
            Student Results ({filteredResults.length})
          </h2>
          
          <div style={{
            display: "flex",
            gap: "12px"
          }}>
            <button
              onClick={() => {/* Export functionality */}}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Export Results
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
            padding: "16px 20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#374151"
          }}>
            <div>Student</div>
            <div>Score</div>
            <div>Correct</div>
            <div>Time</div>
            <div>Submitted</div>
            <div>Actions</div>
          </div>

          {filteredResults.map((result) => (
            <div
              key={result._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "center",
                fontSize: "0.875rem"
              }}
            >
              <div>
                <div style={{
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "4px"
                }}>
                  {result.studentId.name}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: "#6b7280"
                }}>
                  {result.studentId.regNo} • {result.studentId.course}
                </div>
              </div>
              
              <div style={{
                fontWeight: "600",
                color: getScoreColor(result.score)
              }}>
                {result.score}%
              </div>
              
              <div style={{ color: "#6b7280" }}>
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              
              <div style={{ color: "#6b7280" }}>
                {formatTime(result.timeSpent)}
              </div>
              
                             <div style={{ color: "#6b7280" }}>
                 {formatDate(result.submittedAt)}
               </div>
               
               <div>
                 <button
                   onClick={() => handleViewResponse(result)}
                   style={{
                     padding: "6px 12px",
                     backgroundColor: "#6366f1",
                     color: "white",
                     border: "none",
                     borderRadius: "4px",
                     fontSize: "0.75rem",
                     fontWeight: "600",
                     cursor: "pointer"
                   }}
                 >
                   View Response
                 </button>
               </div>

             </div>
          ))}

          {filteredResults.length === 0 && (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#6b7280"
            }}>
              No results found matching your criteria.
            </div>
          )}
                 </div>
       </div>

       {/* Response Modal */}
       {showResponseModal && selectedResult && (
         <div style={{
           position: "fixed",
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: "rgba(0,0,0,0.5)",
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
           zIndex: 1000
         }}>
           <div style={{
             backgroundColor: "white",
             borderRadius: "12px",
             padding: "30px",
             maxWidth: "800px",
             width: "90%",
             maxHeight: "90vh",
             overflowY: "auto"
           }}>
             <div style={{
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               marginBottom: "24px"
             }}>
               <h3 style={{
                 fontSize: "1.25rem",
                 fontWeight: "bold",
                 color: "#1f2937"
               }}>
                 Student Response Details
               </h3>
               <button
                 onClick={() => setShowResponseModal(false)}
                 style={{
                   padding: "8px",
                   backgroundColor: "#f3f4f6",
                   color: "#6b7280",
                   border: "none",
                   borderRadius: "6px",
                   cursor: "pointer"
                 }}
               >
                 ✕
               </button>
             </div>

             <div style={{
               backgroundColor: "#f8fafc",
               padding: "16px",
               borderRadius: "8px",
               marginBottom: "20px"
             }}>
               <div style={{
                 display: "grid",
                 gridTemplateColumns: "1fr 1fr",
                 gap: "16px",
                 fontSize: "0.875rem"
               }}>
                 <div>
                   <span style={{ color: "#6b7280" }}>Student:</span>
                   <span style={{ color: "#1f2937", fontWeight: "600", marginLeft: "8px" }}>
                     {selectedResult.studentId.name}
                   </span>
                 </div>
                 <div>
                   <span style={{ color: "#6b7280" }}>Reg No:</span>
                   <span style={{ color: "#1f2937", marginLeft: "8px" }}>
                     {selectedResult.studentId.regNo}
                   </span>
                 </div>
                 <div>
                   <span style={{ color: "#6b7280" }}>Score:</span>
                   <span style={{ 
                     color: getScoreColor(selectedResult.score), 
                     fontWeight: "600", 
                     marginLeft: "8px" 
                   }}>
                     {selectedResult.score}%
                   </span>
                 </div>
                 <div>
                   <span style={{ color: "#6b7280" }}>Correct Answers:</span>
                   <span style={{ color: "#1f2937", marginLeft: "8px" }}>
                     {selectedResult.correctAnswers}/{selectedResult.totalQuestions}
                   </span>
                 </div>
                 <div>
                   <span style={{ color: "#6b7280" }}>Time Spent:</span>
                   <span style={{ color: "#1f2937", marginLeft: "8px" }}>
                     {formatTime(selectedResult.timeSpent)}
                   </span>
                 </div>
                 <div>
                   <span style={{ color: "#6b7280" }}>Submitted:</span>
                   <span style={{ color: "#1f2937", marginLeft: "8px" }}>
                     {formatDate(selectedResult.submittedAt)}
                   </span>
                 </div>
               </div>
             </div>

             <div style={{
               marginBottom: "20px"
             }}>
               <h4 style={{
                 fontSize: "1rem",
                 fontWeight: "600",
                 color: "#1f2937",
                 marginBottom: "16px"
               }}>
                 Question-by-Question Responses
               </h4>
               
               {/* Real question responses from questionAnalytics data */}
               <div style={{
                 display: "flex",
                 flexDirection: "column",
                 gap: "16px"
               }}>
                 {questionAnalytics?.map((question, index) => {
                   const userAnswer = selectedResult.answers ? selectedResult.answers[question.questionId] : undefined;
                   const isCorrect = userAnswer === question.correctAnswerIndex;
                   
                   return (
                     <div key={question._id} style={{
                       backgroundColor: "#f8fafc",
                       padding: "16px",
                       borderRadius: "8px",
                       border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}`
                     }}>
                       <div style={{
                         display: "flex",
                         justifyContent: "space-between",
                         alignItems: "center",
                         marginBottom: "12px"
                       }}>
                         <h5 style={{
                           fontSize: "0.875rem",
                           fontWeight: "600",
                           color: "#1f2937"
                         }}>
                           Question {index + 1}
                         </h5>
                         <div style={{
                           padding: "4px 8px",
                           backgroundColor: isCorrect ? "#d1fae5" : "#fee2e2",
                           color: isCorrect ? "#065f46" : "#991b1b",
                           borderRadius: "4px",
                           fontSize: "0.75rem",
                           fontWeight: "600"
                         }}>
                           {isCorrect ? "Correct" : "Incorrect"}
                         </div>
                       </div>
                       
                       <div style={{
                         fontSize: "0.875rem",
                         color: "#6b7280",
                         marginBottom: "8px"
                       }}>
                         {question.questionText}
                       </div>
                       
                       <div style={{
                         display: "flex",
                         flexDirection: "column",
                         gap: "8px"
                       }}>
                         {question.options.map((option, optionIndex) => {
                           const isUserAnswer = userAnswer === optionIndex;
                           const isCorrectAnswer = question.correctAnswerIndex === optionIndex;
                           
                           let backgroundColor = "#f3f4f6";
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
                             <div key={optionIndex} style={{
                               padding: "8px 12px",
                               borderRadius: "6px",
                               fontSize: "0.875rem",
                               backgroundColor,
                               border: `2px solid ${borderColor}`,
                               color: textColor,
                               fontWeight: isCorrectAnswer || (isUserAnswer && !isCorrect) ? "600" : "normal"
                             }}>
                               {String.fromCharCode(65 + optionIndex)}. {option}
                               {isCorrectAnswer && (
                                 <span style={{
                                   marginLeft: "8px",
                                   fontSize: "0.75rem",
                                   color: "#10b981"
                                 }}>
                                   ✓ Correct Answer
                                 </span>
                               )}
                               {isUserAnswer && !isCorrect && (
                                 <span style={{
                                   marginLeft: "8px",
                                   fontSize: "0.75rem",
                                   color: "#ef4444"
                                 }}>
                                   ✗ Student's Answer
                                 </span>
                               )}
                             </div>
                           );
                         })}
                       </div>
                       
                       {userAnswer !== undefined ? (
                         <div style={{
                           marginTop: "12px",
                           padding: "8px 12px",
                           backgroundColor: isCorrect ? "#d1fae5" : "#fee2e2",
                           borderRadius: "6px",
                           fontSize: "0.875rem",
                           color: isCorrect ? "#065f46" : "#991b1b",
                           fontWeight: "500"
                         }}>
                           Student's Answer: {String.fromCharCode(65 + userAnswer)}. {question.options[userAnswer]}
                         </div>
                       ) : (
                         <div style={{
                           marginTop: "12px",
                           padding: "8px 12px",
                           backgroundColor: "#fef3c7",
                           borderRadius: "6px",
                           fontSize: "0.875rem",
                           color: "#92400e",
                           fontWeight: "500"
                         }}>
                           No answer provided
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>

             <div style={{
               display: "flex",
               gap: "12px",
               justifyContent: "flex-end"
             }}>
               <button
                 onClick={() => setShowResponseModal(false)}
                 style={{
                   padding: "10px 20px",
                   backgroundColor: "#f3f4f6",
                   color: "#6b7280",
                   border: "none",
                   borderRadius: "6px",
                   fontSize: "0.875rem",
                   fontWeight: "600",
                   cursor: "pointer"
                 }}
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

     </div>
   );
 };

export default QuizAnalytics; 