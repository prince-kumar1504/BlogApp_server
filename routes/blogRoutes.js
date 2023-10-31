const express = require("express");
const {
  getAllBlogsController,
  createBlogController,
  updateBlogController,
  getBlogByIdController,
  deleteBlogController,
  userBlogControlller,
  saveBlogController,
  getSavedBlogsController,
  unsaveBlogController,
} = require("../controllers/blogControlller");

//router object
const router = express.Router();

//routes
// GET || all blogs
router.get("/all-blog", getAllBlogsController);

//POST || create blog
router.post("/create-blog", createBlogController);

//PUT || update blog
router.put("/update-blog/:id", updateBlogController);

//GET || SIngle Blog Details
router.get("/get-blog/:id", getBlogByIdController);

//DELETE || delete blog
router.delete("/delete-blog/:id", deleteBlogController);

//GET || user blog
router.get("/user-blog/:id", userBlogControlller);

//POST || save a blog to user saved blogs
router.post("/save-blog/:id", saveBlogController)

// DELETE || delete the saved blog from saved array user wants to unsave
router.delete("/unsave-blog/:id",unsaveBlogController)

// GET || get all the saved blogs
router.get("/saved-blogs/:id", getSavedBlogsController)

module.exports = router;
