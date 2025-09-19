import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
} from "sequelize";
import { ulid } from "ulid";
import { IModels } from ".";
import { IUserInstance } from "./user";
import { ITestSuiteVersionInstance } from "./test-suite-version";
import { IProjectInstance } from "./project";
import { ITestRunInstance } from "./test-run";

export enum TestSuiteRunStatus {
  Pending = "pending",
  Running = "running",
  Failed = "failed",
  Succeeded = "succeeded",
}

export interface ITestSuiteRunInstance extends Model {
  id: number;
  slug: string;
  status: TestSuiteRunStatus;
  modelSlug?: string;
  modelProvider?: string;
  version: ITestSuiteVersionInstance;
  createdBy: IUserInstance;
  createdAt: Date;
  updatedAt: Date;
  testRuns: ITestRunInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setVersion(
    version: ITestSuiteVersionInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestSuiteRunModel extends ModelStatic<ITestSuiteRunInstance> {
  associate(models: IModels): void;
  createWithUserAndVersion(
    user: IUserInstance,
    version: ITestSuiteVersionInstance,
    modelSlug: string,
    modelProvider: string
  ): Promise<ITestSuiteRunInstance>;
  findAllByProject(project: IProjectInstance): Promise<any[]>;
  findBySlug(
    slug: string,
    suiteSlug: string,
    project: IProjectInstance
  ): Promise<ITestSuiteRunInstance | null>;
}

export default function defineTestSuiteRunModel(
  sequelize: Sequelize
): ITestSuiteRunModel {
  const TestSuiteRun = sequelize.define(
    "TestSuiteRun",
    {
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      modelSlug: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      modelProvider: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "test_suites_runs",
    }
  ) as ITestSuiteRunModel;

  TestSuiteRun.associate = function associate(models) {
    const { User, TestSuiteVersion, TestRun } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        field: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(TestSuiteVersion, {
      as: "version",
      foreignKey: {
        name: "test_suite_version_id",
        allowNull: false,
      },
    });

    this.hasMany(TestRun, {
      as: "testRuns",
      foreignKey: {
        name: "test_suite_run_id",
        allowNull: true,
      },
    });
  };

  TestSuiteRun.createWithUserAndVersion = async function createWithUserAndVersion(
    user: IUserInstance,
    version: ITestSuiteVersionInstance,
    modelSlug: string,
    modelProvider: string
  ) {
    const slug = ulid();
    const newTestSuiteRun = this.build({
      slug,
      status: TestSuiteRunStatus.Pending,
      modelSlug,
      modelProvider,
    });
    newTestSuiteRun.setCreatedBy(user, { save: false });
    newTestSuiteRun.setVersion(version, { save: false });
    await newTestSuiteRun.save();

    return newTestSuiteRun;
  };

  TestSuiteRun.findBySlug = async function findBySlug(
    slug: string,
    suiteSlug: string,
    project: IProjectInstance
  ) {
    return this.findOne({
      where: { slug },
      include: [
        {
          association: "version",
          attributes: ["title", "description", "number", "slug", "isDefault"],
          include: [
            {
              association: "testSuite",
              attributes: ["slug"],
              where: { slug: suiteSlug, project_id: project.id },
              required: true,
            },
          ],
        },
        {
          association: "createdBy",
          attributes: ["email", "displayName", "profileImageURL"],
        },
        {
          association: "testRuns",
          attributes: [
            "slug",
            "status",
            "modelSlug",
            "modelProvider",
            "createdAt",
            "updatedAt",
          ],
          include: [
            {
              association: "version",
              attributes: ["title", "description", "number", "slug"],
              include: [
                {
                  association: "test",
                  attributes: ["slug"],
                },
              ],
            },
          ],
        },
      ],
    });
  };

  TestSuiteRun.findAllByProject = async function findAllByProject(
    project: IProjectInstance
  ) {
    const testSuiteRuns = await TestSuiteRun.findAll({
      include: [
        {
          association: "version",
          attributes: ["id", "title", "description", "number", "slug"],
          include: [
            {
              association: "testSuite",
              attributes: ["id", "slug"],
              where: { project_id: project.id },
              required: true,
            },
          ],
          required: true,
        },
        {
          association: "createdBy",
          attributes: ["id", "email", "displayName"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return testSuiteRuns.map((testSuiteRun) => ({
      slug: testSuiteRun.slug,
      modelSlug: testSuiteRun.modelSlug,
      modelProvider: testSuiteRun.modelProvider,
      status: testSuiteRun.status,
      createdAt: testSuiteRun.createdAt,
      updatedAt: testSuiteRun.updatedAt,
      version: {
        title: testSuiteRun.version.title,
        description: testSuiteRun.version.description,
        number: testSuiteRun.version.number,
        slug: testSuiteRun.version.slug,
        testSuite: {
          slug: testSuiteRun.version.testSuite.slug,
        },
      },
      createdBy: {
        email: testSuiteRun.createdBy.email,
        displayName: testSuiteRun.createdBy.displayName,
        profileImageURL: testSuiteRun.createdBy.profileImageURL,
      },
    }));
  };

  return TestSuiteRun;
}