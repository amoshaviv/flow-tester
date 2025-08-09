import pg from "pg";
import { Sequelize, Model } from "sequelize";
import defineModels, { IModels } from "./models";

let db: Sequelize;
let models: IModels;

async function connect() {
  console.log("Connecting to DB");
  const dbURL: string = process.env.DB_URL || '';

  db = new Sequelize(dbURL, {
    logging: console.log,
    define: {
      paranoid: true,
      underscored: true,
    },
    dialect: "postgres",
    dialectModule: pg,
  });
  await db.authenticate();

  // Define models
  models = defineModels(db);

  // Call associate methods
  Object.keys(db.models).forEach((modelName) => {
    if ("associate" in db.models[modelName]) {
      (db.models[modelName] as any).associate(db.models);
    }
  });

  // await db.sync({ force: true });

  return db;
}

export const getDBConnection = async () => {
  if (db) return db;
  await connect();
  return db;
};

export const getDBModels = async () => {
  if (db && models) return models;
  await connect();
  return models;
};
