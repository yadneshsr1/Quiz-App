const Question = require("../models/Question");

exports.createQuestion = function (req, res, next) {
  const question = new Question({
    ...req.body,
    quizId: req.params.quizId,
  });

  question
    .save()
    .then((savedQuestion) => {
      res.status(201).json(savedQuestion);
    })
    .catch((error) => {
      console.error("Error creating question:", error);
      res.status(400).json({ error: "Failed to create question" });
    });
};

exports.updateQuestion = function (req, res, next) {
  Question.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    })
    .catch((error) => {
      console.error("Error updating question:", error);
      res.status(400).json({ error: "Failed to update question" });
    });
};

exports.quickUpdate = function (req, res, next) {
  const allowedFields = ["title", "points", "tags", "status"];
  const updates = Object.keys(req.body)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  Question.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    })
    .catch((error) => {
      console.error("Error updating question:", error);
      res.status(400).json({ error: "Failed to update question" });
    });
};

exports.deleteQuestion = function (req, res, next) {
  Question.findByIdAndDelete(req.params.id)
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting question:", error);
      res.status(400).json({ error: "Failed to delete question" });
    });
};






exports.listQuestions = function (req, res, next) {
  const { search, tags, status, sort = "-createdAt" } = req.query;
  const query = {
    quizId: req.params.quizId,
  };
  if (search) {
    query.$text = { $search: search };
  }
  if (tags) {
    query.tags = { $all: tags.split(",") };
  }
  if (status) {
    query.status = status;
  }
  Question.find(query)
    .sort(sort)
    .select("-__v")
    .then((questions) => {
      res.json(questions);
    })
    .catch((error) => {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    });
};
