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
import defineTestSuiteModel, { ITestSuiteModel } from "./test-suite";
import defineTestSuiteVersionModel, { ITestSuiteVersionModel } from "./test-suite-version";
import defineTestSuiteRunModel, { ITestSuiteRunModel } from "./test-suite-run";
import defineTestSuiteTestModel, { ITestSuiteTestModel } from "./test-suite-test";
import defineResetPasswordTokenModel from "./reset-password-token";
import defineInviteModel, { IInviteModel } from "./invite";
import defineOrganizationAnalysisModel, { IOrganizationAnalysisModel } from "./organization-analysis";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  OrganizationAnalysis: IOrganizationAnalysisModel;
  UsersOrganizations: IUsersOrganizationsModel;
  Project: IProjectModel;
  Test: ITestModel;
  TestVersion: ITestVersionModel;
  TestRun: ITestRunModel;
  TestSuite: ITestSuiteModel;
  TestSuiteVersion: ITestSuiteVersionModel;
  TestSuiteRun: ITestSuiteRunModel;
  TestSuiteTest: ITestSuiteTestModel;
  Invite: IInviteModel;
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  const Organization = defineOrganizationModel(sequelizeConnection);
  const OrganizationAnalysis = defineOrganizationAnalysisModel(sequelizeConnection);
  const Project = defineProjectModel(sequelizeConnection);
  const Test = defineTestModel(sequelizeConnection);
  const TestVersion = defineTestVersionModel(sequelizeConnection);
  const TestRun = defineTestRunVersionModel(sequelizeConnection);
  const TestSuite = defineTestSuiteModel(sequelizeConnection);
  const TestSuiteVersion = defineTestSuiteVersionModel(sequelizeConnection);
  const TestSuiteRun = defineTestSuiteRunModel(sequelizeConnection);
  const TestSuiteTest = defineTestSuiteTestModel(sequelizeConnection);
  const UsersOrganizations = defineUsersOrganizationsModel(sequelizeConnection);
  const Invite = defineInviteModel(sequelizeConnection);

  return {
    User,
    Organization,
    OrganizationAnalysis,
    UsersOrganizations,
    Project,
    Test,
    TestVersion,
    TestRun,
    TestSuite,
    TestSuiteVersion,
    TestSuiteRun,
    TestSuiteTest,
    Invite,
  };
}
