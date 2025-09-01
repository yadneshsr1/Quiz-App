const Question = require("../models/Question");
const QuestionVersion = require("../models/QuestionVersion");

exports.createQuestion = function (req, res, next) {
  const question = new Question({
    ...req.body,
    quizId: req.params.quizId,
  });

  question
    .save()
    .then((savedQuestion) => {
      return QuestionVersion.create({
        questionId: savedQuestion._id,
        snapshot: savedQuestion.toObject(),
      }).then(() => savedQuestion);
    })
    .then((savedQuestion) => {
      res.status(201).json(savedQuestion);
    })
    .catch((error) => {
      console.error("Error creating question:", error);
      res.status(400).json({ error: "Failed to create question" });
    });
};

exports.updateQuestion = function (req, res, next) {
  let questionRef;
  Question.findById(req.params.id)
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      questionRef = question;
      return QuestionVersion.create({
        questionId: question._id,
        snapshot: question.toObject(),
      });
    })
    .then(() => {
      if (!questionRef) return;
      Object.assign(questionRef, req.body);
      return questionRef.save();
    })
    .then((updatedQuestion) => {
      if (updatedQuestion) {
        res.json(updatedQuestion);
      }
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

exports.softDelete = function (req, res, next) {
  Question.findByIdAndUpdate(
    req.params.id,
    { deletedAt: new Date() },
    { new: true }
  )
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    })
    .catch((error) => {
      console.error("Error deleting question:", error);
      res.status(400).json({ error: "Failed to delete question" });
    });
};

exports.restoreQuestion = function (req, res, next) {
  Question.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true })
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    })
    .catch((error) => {
      console.error("Error restoring question:", error);
      res.status(400).json({ error: "Failed to restore question" });
    });
};

exports.getVersions = function (req, res, next) {
  QuestionVersion.find({
    questionId: req.params.id,
  })
    .sort("-createdAt")
    .then((versions) => {
      res.json(versions);
    })
    .catch((error) => {
      console.error("Error fetching versions:", error);
      res.status(500).json({ error: "Failed to fetch versions" });
    });
};

exports.restoreVersion = function (req, res, next) {
  let versionData;
  let questionRef;

  QuestionVersion.findById(req.params.versionId)
    .then((version) => {
      if (!version || version.questionId.toString() !== req.params.id) {
        return res.status(404).json({ error: "Version not found" });
      }
      versionData = version;
      return Question.findById(req.params.id);
    })
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      questionRef = question;
      return QuestionVersion.create({
        questionId: question._id,
        snapshot: question.toObject(),
      });
    })
    .then(() => {
      if (!questionRef || !versionData) return;
      const restoredData = JSON.parse(JSON.stringify(versionData.snapshot));
      delete restoredData._id;
      delete restoredData.__v;
      Object.assign(questionRef, restoredData);
      return questionRef.save();
    })
    .then((savedQuestion) => {
      if (savedQuestion) {
        res.json(savedQuestion);
      }
    })
    .catch((error) => {
      console.error("Error restoring version:", error);
      res.status(400).json({ error: "Failed to restore version" });
    });
};

exports.listTrash = function (req, res, next) {
  Question.find({
    quizId: req.params.quizId,
    deletedAt: { $ne: null },
  })
    .sort("-deletedAt")
    .then((trashedQuestions) => {
      res.json(trashedQuestions);
    })
    .catch((error) => {
      console.error("Error fetching trash:", error);
      res.status(500).json({ error: "Failed to fetch trash" });
    });
};

exports.hardDelete = function (req, res, next) {
  Question.findById(req.params.id)
    .then((question) => {
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      if (!question.deletedAt) {
        return res
          .status(400)
          .json({ error: "Question must be in trash before purging" });
      }
      return Promise.all([
        Question.findByIdAndDelete(req.params.id),
        QuestionVersion.deleteMany({ questionId: req.params.id }),
      ]);
    })
    .then(() => {
      res.json({ message: "Question purged successfully" });
    })
    .catch((error) => {
      console.error("Error purging question:", error);
      res.status(400).json({ error: "Failed to purge question" });
    });
};

exports.listQuestions = function (req, res, next) {
  const { search, tags, status, sort = "-createdAt" } = req.query;
  const query = {
    quizId: req.params.quizId,
    deletedAt: null,
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
