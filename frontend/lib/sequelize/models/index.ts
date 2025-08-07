import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineOrganizationModel, { IOrganizationModel } from "./organization";
import defineUsersOrganizationsModel, { IUsersOrganizationsModel } from "./users-organizations";
import defineProjectModel, { IProjectModel } from "./project";
import defineTestModel, { ITestModel } from "./test";
import defineRunModel, { IRunModel } from "./run";
import defineResetPasswordTokenModel from "./reset-password-token";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  UsersOrganizations: IUsersOrganizationsModel;
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
  const UsersOrganizations = defineUsersOrganizationsModel(sequelizeConnection);

  return { User, Organization, UsersOrganizations, Project, Test, Run };
}
