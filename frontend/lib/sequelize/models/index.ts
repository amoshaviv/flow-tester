import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineResetPasswordTokenModel from "./reset-password-token";

export interface IModels {
  User: IUserModel 
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  
  return { User };
};
