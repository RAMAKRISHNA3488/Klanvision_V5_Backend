import { BlogPost } from '../models/BlogPost.js';

export const getAllPosts = async (req, res) => {
  try {
    const posts = await BlogPost.findAll();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = req.body;
    const newPost = await BlogPost.create({
      title,
      category,
      author,
      date,
      readTime,
      views: views || 0,
      image: image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      excerpt,
      content,
      status,
      authorLink
    });
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = req.body;
    const post = await BlogPost.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    await post.update({
      title,
      category,
      author,
      date,
      readTime,
      views,
      image,
      excerpt,
      content,
      status,
      authorLink
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    await post.destroy();
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
