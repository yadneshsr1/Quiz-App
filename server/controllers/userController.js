const User = require("../models/User");

exports.createUser = function (req, res, next) {
  const user = new User({ ...req.body });
  user
    .save()
    .then((savedUser) => res.status(201).json(savedUser))
    .catch((error) => {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Failed to create user" });
    });
};

exports.getUser = function (req, res, next) {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    });
};

exports.updateUser = function (req, res, next) {
  User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedUser) => {
      if (!updatedUser)
        return res.status(404).json({ error: "User not found" });
      res.json(updatedUser);
    })
    .catch((error) => {
      console.error("Error updating user:", error);
      res.status(400).json({ error: "Failed to update user" });
    });
};

exports.deleteUser = function (req, res, next) {
  User.findByIdAndDelete(req.params.id)
    .then((deletedUser) => {
      if (!deletedUser)
        return res.status(404).json({ error: "User not found" });
      res.json({ message: "User deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting user:", error);
      res.status(400).json({ error: "Failed to delete user" });
    });
};
