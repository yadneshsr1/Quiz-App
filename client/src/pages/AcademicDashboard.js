// client/src/pages/AcademicDashboard.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
// import { CONFIG } from "../config";
import "./AcademicDashboard.css";

Modal.setAppElement("#root");

const AcademicDashboard = () => {
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    moduleCode: "",
    startTime: "",
    endTime: "",
    accessCode: "",
    allowedIpCidrs: "",
    assignedStudentIds: [], // Add student assignment field
  });
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [questionData, setQuestionData] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0,
    feedback: "", // Added feedback field for justification/reasoning
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // New state for sidebar visibility
  const [isMobile, setIsMobile] = useState(false); // New state for mobile detection
  
  // Add new state for student management
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || userData.role !== "academic") {
      navigate("/login");
      return;
    }
    setUser(userData);
    fetchQuizzes();
    
    // Detect mobile device and adjust sidebar
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarVisible(false); // Auto-hide sidebar on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  // Filter quizzes based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuizzes(quizzes);
    } else {
      const filtered = quizzes.filter(quiz => 
        (quiz.title && quiz.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (quiz.moduleCode && quiz.moduleCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredQuizzes(filtered);
    }
  }, [searchTerm, quizzes]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");
      // Temporarily hardcode the correct endpoint for testing
      const response = await fetch(`/api/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
        setFilteredQuizzes(data);
      } else {
        throw new Error("Failed to fetch quizzes");
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      // Fallback to dummy data
      const dummyQuizzes = [
        {
          _id: 1,
          title: "AI Basics Quiz",
          date: "2025-08-01",
          moduleCode: "CS101",
          studentsEnrolled: 45,
          avgScore: 78,
        },
        {
          _id: 2,
          title: "Cybersecurity Quiz",
          date: "2025-09-10",
          moduleCode: "CS201",
          studentsEnrolled: 32,
          avgScore: 82,
        },
        {
          _id: 3,
          title: "Database Systems",
          date: "2025-07-15",
          moduleCode: "CS301",
          studentsEnrolled: 28,
          avgScore: 75,
        },
      ];
      setQuizzes(dummyQuizzes);
      setFilteredQuizzes(dummyQuizzes);
    }
  };

  // Add function to fetch students
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/auth/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const studentsData = await response.json();
      setStudents(studentsData);
      console.log(`Fetched ${studentsData.length} students for quiz assignment`);
    } catch (error) {
      console.error("Error fetching students:", error);
      // Show user-friendly error
      alert("Failed to load students. Please try again.");
      setStudents([]); // Set empty array on error
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch students when modal opens
  const openModal = () => {
    setModalIsOpen(true);
    fetchStudents(); // Load students when creating a quiz
  };
  const closeModal = () => setModalIsOpen(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add function to handle student selection
  const handleStudentSelection = (studentId, isSelected) => {
    setSelectedStudents(prev => {
      if (isSelected) {
        return [...prev, studentId];
      } else {
        return prev.filter(id => id !== studentId);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // Process form data
      const quizData = { ...formData };
      
      // Add selected students to quiz data
      quizData.assignedStudentIds = selectedStudents;
      
      // Process IP ranges: split by comma, trim whitespace, filter empty strings
      if (quizData.allowedIpCidrs && quizData.allowedIpCidrs.trim()) {
        quizData.allowedIpCidrs = quizData.allowedIpCidrs
          .split(',')
          .map(cidr => cidr.trim())
          .filter(cidr => cidr.length > 0);
      } else {
        quizData.allowedIpCidrs = [];
      }
      
      // Temporarily hardcode the correct endpoint for testing
      const response = await fetch(`/api/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create quiz");
      }

      const newQuiz = await response.json();
      const updatedQuizzes = [newQuiz, ...quizzes];
      setQuizzes(updatedQuizzes);
      setFilteredQuizzes(updatedQuizzes);
      closeModal();

      // Reset form
      setFormData({
        title: "",
        description: "",
        moduleCode: "",
        startTime: "",
        endTime: "",
        accessCode: "",
        allowedIpCidrs: "",
        assignedStudentIds: [],
      });
      setSelectedStudents([]);
    } catch (err) {
      console.error("Error creating quiz:", err);
      alert(`Error creating quiz: ${err.message}`);
    }
  };

  const openQuestionModal = (quizId) => {
    setSelectedQuizId(quizId);
    setQuestionData({
      questionText: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      feedback: "", // Reset feedback field
    });
    setQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setQuestionModalOpen(false);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...questionData.options];
    updatedOptions[index] = value;
    setQuestionData({ ...questionData, options: updatedOptions });
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/quizzes/${selectedQuizId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(questionData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add question");
      }

      const result = await response.json();
      console.log("Question added successfully:", result);
      
      alert("Question added successfully!");
      closeQuestionModal();
      
      // Refresh the quizzes list to show updated question count
      fetchQuizzes();
    } catch (err) {
      console.error("Error adding question:", err);
      alert("Error adding question: " + err.message);
    }
  };

  // Delete functionality
  const openDeleteModal = (quiz) => {
    setQuizToDelete(quiz);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setQuizToDelete(null);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/quizzes/${quizToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete quiz");
      }

      // Remove the quiz from the local state
      const updatedQuizzes = quizzes.filter((quiz) => quiz._id !== quizToDelete._id);
      setQuizzes(updatedQuizzes);
      setFilteredQuizzes(updatedQuizzes);
      closeDeleteModal();
      
      // Show success message
      alert("Quiz deleted successfully!");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert(`Error deleting quiz: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stats = [
    { label: "Total Quizzes", value: quizzes.length, color: "#6366f1" },
    { label: "Active Students", value: 156, color: "#10b981" },
    { label: "Avg Score", value: "78%", color: "#f59e0b" },
    { label: "This Month", value: 12, color: "#ef4444" },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: "80px",
          backgroundColor: "#1e1b4b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "40px",
          }}
        >
          TUOS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#6366f1",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            🏠
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            📊
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            👥
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            ⚙️
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          padding: "30px",
          overflowY: "auto",
          marginRight: isSidebarVisible ? "0px" : "0px", // Adjust margin when sidebar is hidden
          transition: "margin-right 0.3s ease",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "12px 20px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                width: "300px",
                backgroundColor: "white",
              }}
            />
          </div>
          <button
            onClick={openModal}
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
              gap: "8px",
            }}
          >
            + Create New Quiz
          </button>
        </div>

        {/* Quizzes Section */}
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "20px",
            }}
          >
            Your Quizzes
          </h2>

          {filteredQuizzes.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "50px 0", 
              color: "#6b7280",
              fontSize: "1.1rem"
            }}>
              {searchTerm.trim() ? 
                `No quizzes found matching "${searchTerm}". Try adjusting your search terms.` : 
                "No quizzes available yet. Create your first quiz to get started!"
              }
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  border: "1px solid #f1f5f9",
                  transition: "transform 0.2s, box-shadow 0.2s",
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      color: "#1f2937",
                      margin: 0,
                    }}
                  >
                    {quiz.title}
                  </h3>
                  <div
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    {quiz.moduleCode}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => navigate(`/quiz/${quiz._id}/questions`)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#6366f1",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Manage Questions
                  </button>
                  <button
                    onClick={() => navigate(`/quiz-analytics/${quiz._id}`)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    View Analytics
                  </button>

                  <button
                    onClick={() => openDeleteModal(quiz)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fef2f2";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

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
      <div
        style={{
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
        }}
      >
        {/* Header Icons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            📧
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            🔔
          </div>
        </div>

        {/* User Profile */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#6366f1",
              borderRadius: "50%",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "white",
            }}
          >
            👨‍🏫
          </div>

          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Hi {user?.name || "Professor"}!
          </h3>
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
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Create Quiz Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            maxWidth: "700px",
            width: "95%",
            maxHeight: "90vh",
            overflow: "auto",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#1f2937" }}>
          Create New Quiz
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Title:
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Description:
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                minHeight: "100px",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Module Code:
            </label>
            <input
              type="text"
              name="moduleCode"
              value={formData.moduleCode}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Start Time:
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              End Time (Optional):
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Access Code (Optional):
            </label>
            <input
              type="text"
              name="accessCode"
              value={formData.accessCode}
              onChange={handleChange}
              placeholder="Leave blank for no access code"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Allowed IP Ranges (Optional):
            </label>
            <input
              type="text"
              name="allowedIpCidrs"
              value={formData.allowedIpCidrs}
              onChange={handleChange}
              placeholder="e.g., 192.168.1.0/24, 10.0.0.0/8 (comma-separated)"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
            <small style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "4px", display: "block" }}>
              Leave blank to allow access from any IP address. Use CIDR notation (e.g., 192.168.1.0/24 for 192.168.1.x range).
            </small>
          </div>

          {/* Student Assignment Section */}
          <div className="form-section">
            <h3>
              Student Assignment
            </h3>
            <p className="form-help-text">
              Select specific students who can take this quiz. Leave empty to allow all students.
            </p>
            
            <div className="student-assignment-controls">
              <button
                type="button"
                onClick={() => setShowStudentSelector(!showStudentSelector)}
                className="toggle-student-selector"
              >
                {showStudentSelector ? 'Hide' : 'Show'} Student Selection ({selectedStudents.length} selected)
              </button>
            </div>

            {showStudentSelector && (
              <div className="student-selector">
                {studentsLoading ? (
                  <div className="students-loading">
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="students-empty">
                    No students found.
                  </div>
                ) : (
                  <div>
                    <div className="student-list-header">
                      <label>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(students.map(s => s._id));
                            } else {
                              setSelectedStudents([]);
                            }
                          }}
                          checked={selectedStudents.length === students.length && students.length > 0}
                        />
                        Select All ({students.length} students)
                      </label>
                    </div>
                    
                    <div className="student-items">
                      {students.map((student) => (
                        <div key={student._id} className="student-item">
                          <label className="student-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={(e) => handleStudentSelection(student._id, e.target.checked)}
                            />
                            <div className="student-info">
                              <div className="student-photo">
                                {student.photograph ? (
                                  <img 
                                    src={student.photograph} 
                                    alt={student.name}
                                    className="student-photo-img"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="student-photo-placeholder" style={{display: student.photograph ? 'none' : 'flex'}}>
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="student-details">
                                <div className="student-name">
                                  {student.name}
                                </div>
                                <div className="student-meta">
                                  {student.regNo} • {student.course}
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={closeModal}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Question Modal */}
      <Modal
        isOpen={questionModalOpen}
        onRequestClose={closeQuestionModal}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            maxWidth: "500px",
            width: "90%",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#1f2937" }}>Add Question</h2>
        <form onSubmit={submitQuestion}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Question:
            </label>
            <input
              type="text"
              value={questionData.questionText}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  questionText: e.target.value,
                })
              }
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Options:
            </label>
            {questionData.options.map((opt, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                  placeholder={`Option ${idx + 1}`}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Correct Option Index (0-3):
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={questionData.correctAnswerIndex}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  correctAnswerIndex: parseInt(e.target.value),
                })
              }
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Feedback/Justification:
            </label>
            <textarea
              value={questionData.feedback}
              onChange={(e) =>
                setQuestionData({
                  ...questionData,
                  feedback: e.target.value,
                })
              }
              placeholder="Provide justification/reasoning for the correct answer..."
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Add Question
            </button>
            <button
              type="button"
              onClick={closeQuestionModal}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={closeDeleteModal}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            maxWidth: "400px",
            width: "90%",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#fef2f2",
              borderRadius: "50%",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            ⚠️
          </div>
          
          <h2 style={{ marginBottom: "16px", color: "#1f2937" }}>
            Delete Quiz
          </h2>
          
          <p style={{ marginBottom: "24px", color: "#6b7280", lineHeight: "1.5" }}>
            Are you sure you want to delete <strong>"{quizToDelete?.title}"</strong>? 
            This action cannot be undone and will permanently remove the quiz and all its questions.
          </p>
          
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              style={{
                padding: "12px 24px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: isDeleting ? "not-allowed" : "pointer",
                opacity: isDeleting ? 0.6 : 1,
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Quiz"}
            </button>
            <button
              onClick={closeDeleteModal}
              disabled={isDeleting}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcademicDashboard;
