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

  return TestRun;
}
