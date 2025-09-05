import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineOrganizationModel, { IOrganizationModel } from "./organization";
import defineUsersOrganizationsModel, {
  IUsersOrganizationsModel,
} from "./users-organizations";
import defineProjectModel, { IProjectModel } from "./project";
import defineTestModel, { ITestModel } from "./test";
import defineTestVersionModel, { ITestVersionModel } from "./test-version";
import defineTestRunVersionModel, { ITestRunModel } from "./test-run";
import defineResetPasswordTokenModel from "./reset-password-token";
import defineInviteModel, { IInviteModel } from "./invite";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  UsersOrganizations: IUsersOrganizationsModel;
  Project: IProjectModel;
  Test: ITestModel;
  TestVersion: ITestVersionModel;
  TestRun: ITestRunModel;
  Invite: IInviteModel;
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  const Organization = defineOrganizationModel(sequelizeConnection);
  const Project = defineProjectModel(sequelizeConnection);
  const Test = defineTestModel(sequelizeConnection);
  const TestVersion = defineTestVersionModel(sequelizeConnection);
  const TestRun = defineTestRunVersionModel(sequelizeConnection);
  const UsersOrganizations = defineUsersOrganizationsModel(sequelizeConnection);
  const Invite = defineInviteModel(sequelizeConnection);

  return {
    User,
    Organization,
    UsersOrganizations,
    Project,
    Test,
    TestVersion,
    TestRun,
    Invite,
  };
}
