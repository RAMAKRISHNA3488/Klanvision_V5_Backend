import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  },
  author: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.STRING
  },
  readTime: {
    type: DataTypes.STRING,
    field: 'read_time'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image: {
    type: DataTypes.TEXT('long')
  },
  excerpt: {
    type: DataTypes.TEXT
  },
  content: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING
  },
  authorLink: {
    type: DataTypes.STRING,
    field: 'author_link'
  }
}, {
  tableName: 'blog_posts',
  timestamps: false
});

export default BlogPost;
export { BlogPost };
