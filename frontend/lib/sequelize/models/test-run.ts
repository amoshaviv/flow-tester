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
import { ITestVersionInstance } from "./test-version";
import { IProjectInstance } from "./project";

export enum TestRunStatus {
  Pending = "pending",
  Running = "running",
  Failed = "failed",
  Succeeded = "succeeded",
}

interface ITestRunInstance extends Model {
  id: number;
  slug: string;
  status: TestRunStatus;
  resultsURL: string;
  version: ITestVersionInstance;
  createdBy: IUserInstance;
  createdAt: Date;
  updatedAt: Date;
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setVersion(
    version: ITestVersionInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestRunModel extends ModelStatic<ITestRunInstance> {
  associate(models: IModels): void;
  createWithUserAndVersion(
    user: IUserInstance,
    version: ITestVersionInstance
  ): Promise<ITestRunInstance>;
  findAllByProject(project: IProjectInstance): Promise<any[]>;
  findBySlug(
    slug: string,
    testSlug: string,
    project: IProjectInstance
  ): Promise<ITestRunInstance | null>;
}

export default function defineTestRunModel(
  sequelize: Sequelize
): ITestRunModel {
  const TestRun = sequelize.define(
    "TestRun",
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
      resultsURL: {
        type: DataTypes.STRING,
        field: "results_url",
      },
    },
    {
      tableName: "tests_runs",
    }
  ) as ITestRunModel;

  TestRun.associate = function associate(models) {
    const { User, TestVersion } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        field: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(TestVersion, {
      as: "version",
      foreignKey: {
        name: "version_id",
        allowNull: false,
      },
    });
  };

  TestRun.createWithUserAndVersion = async function createWithUserAndVersion(
    user: IUserInstance,
    version: ITestVersionInstance
  ) {
    const slug = ulid();
    const newTestRun = this.build({ slug, status: TestRunStatus.Pending });
    newTestRun.setCreatedBy(user, { save: false });
    newTestRun.setVersion(version, { save: false });
    await newTestRun.save();

    return newTestRun;
  };

  TestRun.findBySlug = async function findBySlug(
    slug: string,
    testSlug: string,
    project: IProjectInstance
  ) {
    return this.findOne({
      where: { slug },
      include: [
        {
          association: "version",
          attributes: ["id", "title", "description", "number", "slug"],
          include: [
            {
              association: "test",
              attributes: ["slug"],
              where: { slug: testSlug, project_id: project.id },
              required: true,
            },
          ],
        },
        {
          association: "createdBy",
          attributes: ["id", "email", "displayName"],
        },
      ],
    });
  };

  TestRun.findAllByProject = async function findAllByProject(
    project: IProjectInstance
  ) {
    // Fetch all test runs for this project
    const testRuns = await TestRun.findAll({
      include: [
        {
          association: "version",
          attributes: ["id", "title", "description", "number", "slug"],
          include: [
            {
              association: "test",
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

    return testRuns.map((testRun) => ({
      slug: testRun.slug,
      status: testRun.status,
      resultsURL: testRun.resultsURL,
      createdAt: testRun.createdAt,
      updatedAt: testRun.updatedAt,
      version: {
        title: testRun.version.title,
        description: testRun.version.description,
        number: testRun.version.number,
        slug: testRun.version.slug,
        test: {
          slug: testRun.version.test.slug,
        },
      },
      createdBy: {
        email: testRun.createdBy.email,
        displayName: testRun.createdBy.displayName,
        profileImageURL: testRun.createdBy.profileImageURL,
      },
    }));
  };

  return TestRun;
}
