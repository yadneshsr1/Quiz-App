import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessCodeModal, setAccessCodeModal] = useState({ isOpen: false, quiz: null });
  const [accessCode, setAccessCode] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState("");
  const [accessCodeError, setAccessCodeError] = useState(""); // eslint-disable-line no-unused-vars
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Set user data
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
    }

    fetchQuizzes();
    fetchCompletedQuizzes();

    // Check if mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarVisible(false); // Auto-hide mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  // Add effect to refresh quiz data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - refresh quiz data
        console.log('Dashboard became visible - refreshing quiz data');
        fetchQuizzes();
        fetchCompletedQuizzes();
      }
    };

    // Add event listener for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh when window gains focus (user returns from another tab/window)
    const handleFocus = () => {
      console.log('Dashboard gained focus - refreshing quiz data');
      fetchQuizzes();
      fetchCompletedQuizzes();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refresh quiz data when user returns to dashboard (location change)
  useEffect(() => {
    // Only refresh if we're on the student dashboard path
    if (location.pathname === '/student') {
      console.log('User returned to dashboard - refreshing quiz data');
      fetchQuizzes();
      fetchCompletedQuizzes();
    }
  }, [location.pathname]);

  // Debug effect to monitor accessCodeError changes
  useEffect(() => {
    console.log("accessCodeError state changed to:", accessCodeError);
  }, [accessCodeError]);

  const fetchQuizzes = async () => {
    try {
      console.log('🔄 fetchQuizzes: Starting API call...');
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/quizzes/eligible`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log(`🔄 fetchQuizzes: API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch eligible quizzes: ${response.status}`);
      }

      const quizzes = await response.json();
      console.log(`🔄 fetchQuizzes: Received ${quizzes.length} available quizzes`);
      setAvailableQuizzes(quizzes);
      setIsLoading(false);
      console.log('🔄 fetchQuizzes: State updated successfully');
    } catch (error) {
      console.error("❌ Error fetching eligible quizzes:", error);
      console.log("⚠️  Using fallback hardcoded data - this might be the issue!");
      const hardcodedQuizzes = [
        {
          _id: 1,
          title: "Introduction to Computer Science",
          description: "Test your knowledge of basic computer science concepts including algorithms, data structures, and programming fundamentals.",
          moduleCode: "CS101",
          startTime: new Date().toISOString(),
          duration: 60,
          totalQuestions: 25
        },
        {
          _id: 2,
          title: "Web Development Fundamentals",
          description: "Assess your understanding of HTML, CSS, and JavaScript basics for modern web development.",
          moduleCode: "WD201",
          startTime: new Date().toISOString(),
          duration: 45,
          totalQuestions: 20
        },
        {
          _id: 3,
          title: "Database Management Systems",
          description: "Evaluate your knowledge of SQL, database design, and data management principles.",
          moduleCode: "DB301",
          startTime: new Date().toISOString(),
          duration: 90,
          totalQuestions: 30
        },
        {
          _id: 4,
          title: "Cybersecurity Essentials",
          description: "Test your understanding of network security, cryptography, and cyber threat prevention.",
          moduleCode: "CS401",
          startTime: new Date().toISOString(),
          duration: 75,
          totalQuestions: 28
        },
        {
          _id: 5,
          title: "Software Engineering Principles",
          description: "Assess your knowledge of software development methodologies, design patterns, and best practices.",
          moduleCode: "SE501",
          startTime: new Date().toISOString(),
          duration: 120,
          totalQuestions: 35
        },
        {
          _id: 6,
          title: "Artificial Intelligence Basics",
          description: "Test your understanding of machine learning algorithms, neural networks, and AI fundamentals.",
          moduleCode: "AI601",
          startTime: new Date().toISOString(),
          duration: 60,
          totalQuestions: 22
        }
      ];
      
      setAvailableQuizzes(hardcodedQuizzes);
      setIsLoading(false);
    }
  };

  const fetchCompletedQuizzes = async () => {
    try {
      console.log('🔄 fetchCompletedQuizzes: Starting API call...');
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/quizzes/completed`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log(`🔄 fetchCompletedQuizzes: API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch completed quizzes: ${response.status}`);
      }

      const quizzes = await response.json();
      console.log(`🔄 fetchCompletedQuizzes: Received ${quizzes.length} completed quizzes`);
      setCompletedQuizzes(quizzes);
      console.log('🔄 fetchCompletedQuizzes: State updated successfully');
    } catch (error) {
      console.error("❌ Error fetching completed quizzes:", error);
      console.log("⚠️  Completed quizzes fetch failed - this explains empty completed section!");
    }
  };

  const handleStartQuiz = async (quiz) => {
    // Check if quiz has an access code (we'll assume it does if we can't determine)
    // In a real implementation, the backend could include a flag
    setAccessCodeModal({ isOpen: true, quiz });
    setAccessCodeError(""); // Clear any previous error messages
  };

  const handleLaunchQuiz = async () => {
    if (!accessCodeModal.quiz) return;
    
    setIsLaunching(true);
    try {
      const token = localStorage.getItem("token");
      
      // Step 1: Launch quiz with access code
      const launchResponse = await fetch(`/api/quizzes/${accessCodeModal.quiz._id}/launch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ accessCode })
      });

      if (!launchResponse.ok) {
        const errorData = await launchResponse.json();
        console.log("Launch response error:", errorData); // Debug log
        
        // Check if it's an access code error (check both error and message fields)
        if (errorData.error && (
          errorData.error.toLowerCase().includes("access code") || 
          errorData.error.toLowerCase().includes("invalid access code")
        )) {
          console.log("Setting access code error"); // Debug log
          setAccessCodeError("Invalid access code. Please try again.");
          console.log("accessCodeError state should now be set"); // Debug log
          setIsLaunching(false); // Reset loading state
          return; // Don't throw error, just show the warning
        }
        
        // For other errors, show them as general errors
        setAccessCodeError(errorData.message || errorData.error || "Failed to launch quiz");
        setIsLaunching(false); // Reset loading state
        return;
      }

      // Get the launch ticket from the response
      const launchData = await launchResponse.json();
      const launchTicket = launchData.ticket;

      // Step 2: Start the quiz with the launch ticket
      const startResponse = await fetch(`/api/quizzes/${accessCodeModal.quiz._id}/start`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-quiz-launch": launchTicket
        }
      });

      if (!startResponse.ok) {
        throw new Error("Failed to start quiz");
      }

      // Navigate to quiz taking page
      navigate(`/quiz/${accessCodeModal.quiz._id}`);
    } catch (error) {
      console.error("Error launching quiz:", error);
      setError(error.message);
    } finally {
      setIsLaunching(false);
      // Don't close modal here - let the error handling manage it
    }
  };

  const closeAccessCodeModal = () => {
    setAccessCodeModal({ isOpen: false, quiz: null });
    setAccessCode("");
    setAccessCodeError(""); // Clear any previous error messages
  };

  const handleViewResults = (quiz) => {
    // Navigate to results page with quiz data
    navigate(`/quiz-results/${quiz._id}`, {
      state: {
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        correctAnswers: quiz.correctAnswers,
        timeSpent: quiz.timeSpent,
        submittedAt: quiz.submittedAt,
        completed: true
      }
    });
  };



  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
        <div style={{ fontSize: "1.5rem", color: "#64748b" }}>Loading...</div>
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
      
      {/* Left Sidebar */}
      <div style={{
        width: "80px",
        backgroundColor: "#1e1b4b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "40px"
        }}>
          TUOS
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#6366f1",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            cursor: "pointer"
          }}>
            🏠
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
            cursor: "pointer"
          }}>
            ⭐
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
            cursor: "pointer"
          }}>
            ⚙️
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
            cursor: "pointer"
          }}>
            👤
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
            cursor: "pointer"
          }}>
            📄
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
            cursor: "pointer"
          }}>
            ❓
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        padding: "30px",
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "12px 20px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                width: "300px",
                backgroundColor: "white"
              }}
            />
          </div>
          {/* <button
            onClick={() => navigate("/create-quiz")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            Create Quiz +
          </button> */}
        </div>



        {/* Available Quizzes Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              margin: "0"
            }}>
              Available Quizzes
            </h2>
            {/* Debug: Manual refresh button */}
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh button clicked');
                console.log('📊 Current state before refresh:', {
                  available: availableQuizzes.length,
                  completed: completedQuizzes.length
                });
                
                try {
                  await Promise.all([
                    fetchQuizzes(),
                    fetchCompletedQuizzes()
                  ]);
                  
                  console.log('✅ Manual refresh completed');
                  // Give React a moment to update state, then log new state
                  setTimeout(() => {
                    console.log('📊 Current state after refresh:', {
                      available: availableQuizzes.length,
                      completed: completedQuizzes.length
                    });
                  }, 100);
                } catch (error) {
                  console.error('❌ Manual refresh failed:', error);
                }
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.75rem",
                cursor: "pointer"
              }}
            >
              🔄 Refresh
            </button>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px"
          }}>
            {availableQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  border: "1px solid #f1f5f9",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px"
                }}>
                  <h3 style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0
                  }}>
                    {quiz.title}
                  </h3>
                  <div style={{
                    padding: "4px 12px",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600"
                  }}>
                    {quiz.moduleCode}
                  </div>
                </div>
                
                <p style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                  marginBottom: "20px"
                }}>
                  {quiz.description}
                </p>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px"
                }}>
                  <div>
                    <div style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      marginBottom: "4px"
                    }}>
                      Duration
                    </div>
                    <div style={{
                      fontSize: "1.125rem",
                      fontWeight: "bold",
                      color: "#1f2937"
                    }}>
                      {quiz.duration} min
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      marginBottom: "4px"
                    }}>
                      Questions
                    </div>
                    <div style={{
                      fontSize: "1.125rem",
                      fontWeight: "bold",
                      color: "#10b981"
                    }}>
                      {quiz.totalQuestions}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#4f46e5";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#6366f1";
                  }}
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
                 </div>
       </div>

       {/* Completed Quizzes Section */}
       {completedQuizzes.length > 0 && (
         <div style={{ marginTop: "40px" }}>
           <h2 style={{
             fontSize: "1.5rem",
             fontWeight: "bold",
             color: "#1f2937",
             marginBottom: "20px"
           }}>
             Completed Quizzes
           </h2>
           
           <div style={{
             display: "grid",
             gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
             gap: "20px"
           }}>
             {completedQuizzes.map((quiz) => (
               <div
                 key={quiz._id}
                 style={{
                   backgroundColor: "white",
                   borderRadius: "12px",
                   padding: "24px",
                   boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                   border: "1px solid #f1f5f9",
                   transition: "transform 0.2s, box-shadow 0.2s"
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.transform = "translateY(-2px)";
                   e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = "translateY(0)";
                   e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                 }}
               >
                 <div style={{
                   display: "flex",
                   justifyContent: "space-between",
                   alignItems: "flex-start",
                   marginBottom: "16px"
                 }}>
                   <h3 style={{
                     fontSize: "1.25rem",
                     fontWeight: "bold",
                     color: "#1f2937",
                     margin: 0
                   }}>
                     {quiz.title}
                   </h3>
                   <div style={{
                     padding: "4px 12px",
                     backgroundColor: "#dbeafe",
                     color: "#1e40af",
                     borderRadius: "20px",
                     fontSize: "0.75rem",
                     fontWeight: "600"
                   }}>
                     {quiz.moduleCode}
                   </div>
                 </div>
                 
                 <div style={{
                   display: "grid",
                   gridTemplateColumns: "1fr 1fr",
                   gap: "16px",
                   marginBottom: "20px"
                 }}>
                   <div>
                     <div style={{
                       fontSize: "0.875rem",
                       color: "#6b7280",
                       marginBottom: "4px"
                     }}>
                       Score
                     </div>
                     <div style={{
                       fontSize: "1.5rem",
                       fontWeight: "bold",
                       color: quiz.score >= 70 ? "#10b981" : quiz.score >= 50 ? "#f59e0b" : "#ef4444"
                     }}>
                       {quiz.score}%
                     </div>
                   </div>
                   <div>
                     <div style={{
                       fontSize: "0.875rem",
                       color: "#6b7280",
                       marginBottom: "4px"
                     }}>
                       Completed
                     </div>
                     <div style={{
                       fontSize: "1rem",
                       fontWeight: "600",
                       color: "#6b7280"
                     }}>
                       {new Date(quiz.submittedAt).toLocaleDateString()}
                     </div>
                   </div>
                 </div>
                 
                 <button
                   onClick={() => handleViewResults(quiz)}
                   style={{
                     width: "100%",
                     padding: "12px",
                     backgroundColor: "#10b981",
                     color: "white",
                     border: "none",
                     borderRadius: "8px",
                     fontSize: "0.875rem",
                     fontWeight: "600",
                     cursor: "pointer",
                     transition: "background-color 0.2s"
                   }}
                   onMouseEnter={(e) => {
                     e.target.style.backgroundColor = "#059669";
                   }}
                   onMouseLeave={(e) => {
                     e.target.style.backgroundColor = "#10b981";
                   }}
                 >
                   View Results
                 </button>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Right Sidebar Toggle Button */}
      <div
        style={{
          position: "fixed",
          right: isSidebarVisible ? (isMobile ? "280px" : "320px") : (isMobile ? "10px" : "20px"),
          top: isMobile ? "20px" : "50%",
          transform: isMobile ? "none" : "translateY(-50%)",
          zIndex: 1000,
          transition: "right 0.3s ease",
        }}
      >
        <button
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          {isSidebarVisible ? "◀" : "▶"}
        </button>
      </div>

      {/* Right Sidebar */}
      <div style={{
        width: isSidebarVisible ? "300px" : "0px",
        backgroundColor: "white",
        padding: isSidebarVisible ? "30px" : "0px",
        boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        opacity: isSidebarVisible ? 1 : 0,
      }}>
        {/* Header Icons */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#f3f4f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            📧
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#f3f4f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
            🔔
          </div>
        </div>

        {/* User Profile */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#6366f1",
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            color: "white"
          }}>
            👩‍🎓
          </div>
          
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "8px"
          }}>
            Hi {user?.name || "Student"}!
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "20px"
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
                3
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: "#92400e"
              }}>
                Quizzes Completed
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
                80%
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: "#065f46"
              }}>
                Averge Score
              </div>
            </div>
          </div>
        </div>



        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            marginTop: "auto",
            padding: "12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* Access Code Modal */}
      {accessCodeModal.isOpen && (
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
            padding: "30px",
            borderRadius: "12px",
            width: "400px",
            textAlign: "center"
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "20px"
            }}>
              Enter Access Code for "{accessCodeModal.quiz?.title}"
            </h2>
            <input
              type="text"
              placeholder="Access Code"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                // Clear error when user starts typing
                if (accessCodeError) {
                  setAccessCodeError("");
                }
              }}
              style={{
                padding: "12px 20px",
                border: accessCodeError ? "2px solid #ef4444" : "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                width: "100%",
                marginBottom: "10px",
                backgroundColor: "white"
              }}
            />
            {/* Access Code Error Message */}
            {accessCodeError && (
              <div style={{
                color: "#ef4444",
                fontSize: "0.875rem",
                marginBottom: "20px",
                padding: "8px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                textAlign: "left"
              }}>
                ⚠️ {accessCodeError}
              </div>
            )}

            <button
              onClick={handleLaunchQuiz}
              disabled={isLaunching}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#4f46e5";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#6366f1";
              }}
            >
              {isLaunching ? "Launching..." : "Launch Quiz"}
            </button>
            <button
              onClick={closeAccessCodeModal}
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
                marginTop: "10px"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard; 