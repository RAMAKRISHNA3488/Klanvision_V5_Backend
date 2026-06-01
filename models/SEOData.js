import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SEOData = sequelize.define('SEOData', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  siteTitle: {
    type: DataTypes.STRING,
    field: 'site_title'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    field: 'meta_description'
  },
  keywords: {
    type: DataTypes.STRING
  },
  sitemapUrl: {
    type: DataTypes.STRING,
    field: 'sitemap_url'
  },
  googleConsoleId: {
    type: DataTypes.STRING,
    field: 'google_console_id'
  },
  robotsTxt: {
    type: DataTypes.TEXT,
    field: 'robots_txt'
  }
}, {
  tableName: 'seo_data',
  timestamps: false
});

export default SEOData;
export { SEOData };
