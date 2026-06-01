import sequelize from './config/db.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    const [results] = await sequelize.query("SELECT * FROM settings");
    console.log("Settings in DB:");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
}

run();
