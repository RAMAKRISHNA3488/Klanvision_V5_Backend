import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'klanvision_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'system',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3305'),
    dialect: 'mysql',
    logging: false, // Turn off query logs in console, matches production Spring Boot logging toggles
    define: {
      timestamps: false // We will define timestamps manually on entities where they are needed
    }
  }
);

export default sequelize;
export { sequelize };
