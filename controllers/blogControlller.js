const mongoose = require("mongoose");
const blogModel = require("../models/blogModel");
const userModel = require("../models/userModel");

//GET ALL BLOGS
exports.getAllBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel.find({}).sort({ createdAt: -1 }).populate("user");
    if (!blogs) {
      return res.status(200).send({
        success: false,
        message: "No Blogs Found",
      });
    }
    return res.status(200).send({
      success: true,
      BlogCount: blogs.length,
      message: "All Blogs lists",
      blogs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error While Getting Blogs",
      error,
    });
  }
};

//Create Blog
exports.createBlogController = async (req, res) => {
  try {
    const { title, description, image, user } = req.body;

    //validation
    if (!title || !description || !image || !user) {
      return res.status(400).send({
        success: false,
        message: "Please Fill All Fields",
      });
    }
    const exisitingUser = await userModel.findById(user);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newBlog = new blogModel({ title, description, image, user });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newBlog.save({ session });
    exisitingUser.blogs.push(newBlog);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newBlog.save();
    return res.status(201).send({
      success: true,
      message: "Blog Created!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error While Creting blog",
      error,
    });
  }
};

//Update Blog
exports.updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;
    const blog = await blogModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).send({
      success: true,
      message: "Blog Updated!",
      blog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Updating Blog",
      error,
    });
  }
};

//SIngle Blog
exports.getBlogByIdController = async (req, res) => {
  try {
    const { id } = req?.params;
    const { userId } = req?.query;
    console.log(userId);
    const blog = await blogModel.findById(id).populate("user");

    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "blog not found with this is",
      });
    }
    // Check for the inc of view so that it does not icrease while author sees this post.
    if (userId && userId === blog.user.id) {
      return res.status(200).send({
        success: true,
        message: "Fetched single blog",
        blog,
      });
    }

    // Increment the views count by 1 whenever the API is called
    blog.views += 1;
    await blog.save();


    return res.status(200).send({
      success: true,
      message: "Fetched single blog not author",
      blog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "error while getting single blog",
      error,
    });
  }
};

//Delete Blog
exports.deleteBlogController = async (req, res) => {
  try {
    const blog = await blogModel
      // .findOneAndDelete(req.params.id)
      .findByIdAndDelete(req.params.id)
      .populate("user");
    await blog.user.blogs.pull(blog);
    await blog.user.save();
    return res.status(200).send({
      success: true,
      message: "Blog Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }
};

//GET USER BLOG
exports.userBlogControlller = async (req, res) => {
  try {
    const userBlog = await userModel.findById(req.params.id).populate({ path: "blogs", options: { sort: { createdAt: -1 } } });
    // userBlog.sort({ createdAt: -1 })

    if (!userBlog) {
      return res.status(404).send({
        success: false,
        message: "blogs not found with this id",
      });
    }
    return res.status(200).send({
      success: true,
      message: "user blogs",
      userBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "error in user blog",
      error,
    });
  }
};

// save the blogs to saved and user id of user to saved by
exports.saveBlogController = async (req, res) => {
  const { id } = req?.params;  // blog id
  const { userId } = req?.query; // user id
  console.log(userId)
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Check if the blogId is already in the savedBlogs array
    if (user.savedBlogs.includes(id)) {
      return res.status(400).json({ success: false, message: 'Blog already saved' });
    }


    // Push userId to blog's savedBy array and save the blog
    blog.savedBy.push(userId);
    await blog.save();

    // Push blogId to user's savedBlogs array and save the user
    user.savedBlogs.push(id);
    await user.save();

    return res.status(200).json({ success: true, message: 'Blog saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// unsave blogs from controller
exports.unsaveBlogController = async (req, res) => {
  const { id } = req.params;  // blog id
  const { userId } = req.query; // user id

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Remove the blogId from the savedBlogs array
    user.savedBlogs = user.savedBlogs.filter(savedBlogId => savedBlogId.toString() !== id.toString());
    await user.save();

    // Remove the user ID from the savedBy array
    blog.savedBy = blog.savedBy.filter(savedUserId => savedUserId.toString() !== userId.toString());
    await blog.save();

    return res.status(200).json({ success: true, message: 'Blog unsaved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// get saved blogs

exports.getSavedBlogsController = async (req, res) => {
  const { id } = req.params; // user id

  try {
    const user = await userModel.findById(id).populate({
      path: 'savedBlogs',
      populate: { path: 'user' } // Populate the 'user' field inside 'savedBlogs'
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const savedBlogs = user.savedBlogs;
    return res.status(200).json({ success: true, savedBlogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
