import React, { useState, useEffect } from "react";
// import { CONFIG } from "../config";
import {
  Drawer,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "react-query";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`question-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}


const QuestionEditorDrawer = ({ open, question, onClose, onUpdate, quizId }) => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    options: [""],
    answerKey: 0,
    points: 1,
    feedback: "",
  });


  const queryClient = useQueryClient();


  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || "",
        options: question.options || [""],
        answerKey: question.answerKey || 0,
        points: question.points || 1,
        feedback: question.feedback || "",
      });
    } else {
      // Reset form for new question
      setFormData({
        title: "",
        options: [""],
        answerKey: 0,
        points: 1,
        feedback: "",
      });
    }
  }, [question]);

  const createMutation = useMutation(
    async (data) => {
      const response = await fetch(
        `/api/quizzes/${quizId}/questions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create question");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["questions", quizId]);
        onUpdate();
      },
    }
  );

  const updateMutation = useMutation(
    async (data) => {
      const response = await fetch(
        `/api/questions/${question._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update question");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["questions", quizId]);
        onUpdate();
      },
    }
  );


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (question?._id) {
        // Update existing question
        await updateMutation.mutateAsync(formData);
      } else {
        // Create new question
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question: " + error.message);
    }
  };

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const handleOptionChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };




  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: "50%" } }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {question?._id ? "Edit Question" : "New Question"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
        <Tab label="Content" />
        <Tab label="Answer & Scoring" />
        <Tab label="Feedback" />
      </Tabs>

      <Box component="form" onSubmit={handleSubmit} sx={{ overflow: "auto" }}>
        <TabPanel value={tab} index={0}>
          <Stack spacing={3}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Options
              </Typography>
              {formData.options.map((option, index) => (
                <TextField
                  key={index}
                  fullWidth
                  required
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  margin="dense"
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                sx={{ mt: 1 }}
              >
                Add Option
              </Button>
            </Box>
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={formData.answerKey}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    answerKey: e.target.value,
                  }))
                }
              >
                {formData.options.map((_, index) => (
                  <MenuItem key={index} value={index}>
                    Option {index + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Points"
              type="number"
              value={formData.points}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  points: parseInt(e.target.value) || 0,
                }))
              }
            />
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <TextField
            label="Feedback"
            fullWidth
            multiline
            rows={4}
            value={formData.feedback}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, feedback: e.target.value }))
            }
          />
        </TabPanel>


        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button 
            variant="contained" 
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading 
              ? "Saving..." 
              : question?._id ? "Update Question" : "Create Question"
            }
          </Button>
        </Box>
      </Box>

    </Drawer>
  );
};

export default QuestionEditorDrawer;
