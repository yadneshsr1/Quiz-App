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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  RestoreFromTrash as RestoreIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient, useQuery } from "react-query";

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

const fetchVersions = async (questionId) => {
  if (!questionId) return [];
  const response = await fetch(
            `/api/questions/${questionId}/versions`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch versions");
  return response.json();
};

const QuestionEditorDrawer = ({ open, question, onClose, onUpdate, quizId }) => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    stem: "",
    options: [""],
    answerKey: 0,
    points: 1,
    tags: [],
    status: "draft",
    feedback: "",
  });
  const [newTag, setNewTag] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery(
    ["versions", question?._id],
    () => fetchVersions(question?._id),
    {
      enabled: !!question?._id,
    }
  );

  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || "",
        stem: question.stem || "",
        options: question.options || [""],
        answerKey: question.answerKey || 0,
        points: question.points || 1,
        tags: question.tags || [],
        status: question.status || "draft",
        feedback: question.feedback || "",
      });
    } else {
      // Reset form for new question
      setFormData({
        title: "",
        stem: "",
        options: [""],
        answerKey: 0,
        points: 1,
        tags: [],
        status: "draft",
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

  const restoreVersionMutation = useMutation(
    async (versionId) => {
      const response = await fetch(
        `/api/questions/${question._id}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to restore version");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["questions", quizId]);
        queryClient.invalidateQueries(["versions", question._id]);
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

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      setNewTag("");
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToDelete),
    }));
  };

  const handleRestoreVersion = async () => {
    if (selectedVersion) {
      try {
        await restoreVersionMutation.mutateAsync(selectedVersion._id);
        setRestoreDialogOpen(false);
      } catch (error) {
        console.error("Error restoring version:", error);
        alert("Failed to restore version: " + error.message);
      }
    }
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
        <Tab label="Metadata" />
        {question?._id && <Tab label="History" />}
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
            <TextField
              label="Question Stem"
              fullWidth
              multiline
              rows={4}
              required
              value={formData.stem}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, stem: e.target.value }))
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

        <TabPanel value={tab} index={3}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ mb: 2 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                />
                <Button onClick={handleAddTag} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        {question?._id && (
          <TabPanel value={tab} index={4}>
            <List>
              {versions.map((version) => (
                <ListItem key={version._id}>
                  <ListItemText
                    primary={new Date(version.createdAt).toLocaleString()}
                    secondary={`Version ${version._id}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setSelectedVersion(version);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>
        )}

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

      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          Are you sure you want to restore this version? Current changes will be
          saved as a new version.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreVersion} variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default QuestionEditorDrawer;
