import sequelize from './config/db.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log("Tables in database:", tables);
    
    for (const table of tables) {
      const columns = await queryInterface.describeTable(table);
      console.log(`\nColumns of '${table}' table:`);
      console.log(Object.keys(columns));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
}

run();
