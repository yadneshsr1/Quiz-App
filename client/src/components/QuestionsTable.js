import React, { useState } from "react";
// import { CONFIG } from "../config";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Tooltip,
  TablePagination,
  Box,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "react-query";

const fetchQuestions = async ({ quizId, search }) => {
  try {
    if (!quizId) {
      throw new Error("Quiz ID is required");
    }

    console.log("Fetching questions for quiz ID:", quizId);

    // Build query parameters
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    // Temporarily hardcode the correct endpoint for testing
    const response = await fetch(
      `/api/quizzes/${quizId}/questions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch questions");
    }

    const questions = await response.json();
    console.log("Fetched questions:", questions);

    return questions.map((q, index) => ({
      ...q,
      id: q._id || index,
      title: q.title, // Use title for display
    }));
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

const QuestionsTable = ({ quizId, onQuestionSelect, refreshTrigger }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    async (questionId) => {
      // Temporarily hardcode the correct endpoint for testing
      const response = await fetch(
        `/api/questions/${questionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete question");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["questions", quizId]);
      },
      onError: (error) => {
        console.error("Error deleting question:", error);
        alert("Failed to delete question. Please try again.");
      },
    }
  );

  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery(
    ["questions", quizId, search, refreshTrigger],
    () =>
      fetchQuestions({
        quizId,
        search,
      }),
    {
      keepPreviousData: true,
      enabled: !!quizId,
    }
  );

  if (!quizId) {
    return (
      <Typography color="error">
        No quiz ID provided. Unable to fetch questions.
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading questions: {error.message}
      </Typography>
    );
  }

  if (isLoading) {
    return <Typography>Loading questions...</Typography>;
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };





  const handleDelete = async (questionId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this question?")) {
        return;
      }

      await deleteMutation.mutateAsync(questionId);
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question: " + error.message);
    }
  };

  return (
    <>
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
        <Box
          sx={{
            flex: "1 1 100%",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() =>
              onQuestionSelect({
                title: "",
                options: [""],
                answerKey: 0,
                feedback: "",
                points: 1,
              })
            }
          >
            Add Question
          </Button>
          <TextField
            variant="outlined"
            placeholder="Search questions..."
            size="small"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

      </Toolbar>



      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Points</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((question) => (
                <TableRow key={question.id || question._id}>
                  <TableCell>
                    {question.title}
                  </TableCell>
                  <TableCell>{question.points || 1}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => onQuestionSelect(question)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(question._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={questions.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default QuestionsTable;
