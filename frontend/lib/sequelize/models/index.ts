import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineOrganizationModel, { IOrganizationModel } from "./organization";
import defineProjectModel, { IProjectModel } from "./project";
import defineTestModel, { ITestModel } from "./test";
import defineRunModel, { IRunModel } from "./run";
import defineResetPasswordTokenModel from "./reset-password-token";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  Project: IProjectModel;
  Test: ITestModel;
  Run: IRunModel;
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  const Organization = defineOrganizationModel(sequelizeConnection);
  const Project = defineProjectModel(sequelizeConnection);
  const Test = defineTestModel(sequelizeConnection);
  const Run = defineRunModel(sequelizeConnection);

  return { User, Organization, Project, Test, Run };
}
