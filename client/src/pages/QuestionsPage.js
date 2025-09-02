import React, { useState } from "react";
import { Box, Container, Paper, Typography, Alert } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import QuestionsTable from "../components/QuestionsTable";
import QuestionEditorDrawer from "../components/QuestionEditorDrawer";

const QuestionsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!quizId) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          No quiz ID provided. Please select a quiz to manage its questions.
        </Alert>
      </Container>
    );
  }

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedQuestion(null);
  };

  const handleQuestionUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Manage Questions
            </Typography>
            <QuestionsTable
              quizId={quizId}
              onQuestionSelect={handleQuestionSelect}
              refreshTrigger={refreshTrigger}
            />
          </Paper>
        </Box>
        <QuestionEditorDrawer
          open={drawerOpen}
          question={selectedQuestion}
          onClose={handleDrawerClose}
          onUpdate={handleQuestionUpdate}
          quizId={quizId}
        />
      </Box>
    </Container>
  );
};

export default QuestionsPage;
