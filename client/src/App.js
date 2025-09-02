// client/src/App.js

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import AcademicDashboard from "./pages/AcademicDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Login from "./pages/Login";
import QuizTaking from "./pages/QuizTaking";
import QuizResults from "./pages/QuizResults";
import QuizAnalytics from "./pages/QuizAnalytics";
import QuestionsPage from "./pages/QuestionsPage";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/academic" element={<AcademicDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/quiz/:quizId" element={<QuizTaking />} />
          <Route path="/quiz-results/:quizId" element={<QuizResults />} />
          <Route path="/quiz-analytics/:quizId" element={<QuizAnalytics />} />
          <Route path="/quiz/:quizId/questions" element={<QuestionsPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
