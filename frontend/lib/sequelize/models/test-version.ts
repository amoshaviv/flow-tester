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
import { ITestInstance } from "./test";
import { ITestRunInstance } from "./test-run";

export interface ITestVersionInstance extends Model {
  id: number;
  slug: string;
  title: string;
  description: string;
  number: number;
  isDefault: boolean;
  test: ITestInstance;
  runs: ITestRunInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setTest(
    test: ITestInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestVersionModel extends ModelStatic<ITestVersionInstance> {
  associate(models: IModels): void;
  createWithTest(
    title: string,
    description: string,
    user: IUserInstance,
    test: ITestInstance,
    isDefault: boolean
  ): Promise<ITestVersionInstance>;
  findNextVersionNumber(test: ITestInstance): Promise<number>;
  setAsDefault(versionSlug: string, test: ITestInstance): Promise<ITestVersionInstance | null>;
}

export default function defineTestVersionModel(
  sequelize: Sequelize
): ITestVersionModel {
  const TestVersion = sequelize.define(
    "TestVersion",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tests_versions",
    }
  ) as ITestVersionModel;

  TestVersion.associate = function associate(models) {
    const { User, Test, TestRun } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(Test, {
      as: "test",
      foreignKey: {
        name: "test_id",
        allowNull: false,
      },
    });

    this.hasMany(TestRun, {
      as: "runs",
      foreignKey: {
        name: "version_id",
        allowNull: false,
      },
    });
  };

  TestVersion.findNextVersionNumber = async function findNextVersionNumber(
    test: ITestInstance
  ) {
    // Lookup for possible username
    let latestVersion = await this.findOne({
      where: {
        test_id: test.id,
      },
      paranoid: false,
      order: [["number", "DESC"]], // sort by version highest first
    });

    if (latestVersion) return latestVersion.number + 1;
    return 1;
  };

  TestVersion.createWithTest = async function createWithTest(
    title: string,
    description: string,
    user: IUserInstance,
    test: ITestInstance,
    isDefault: boolean
  ) {
    const number = await this.findNextVersionNumber(test);
    const slug = ulid();
    const newTestVersion = this.build({ title, description, number, slug, isDefault });

    newTestVersion.setCreatedBy(user, { save: false });
    newTestVersion.setTest(test, { save: false });
    await newTestVersion.save();

    return newTestVersion;
  };

  TestVersion.setAsDefault = async function setAsDefault(
    versionSlug: string,
    test: ITestInstance
  ) {
    // First, set all versions of this test to not be default
    await this.update(
      { isDefault: false },
      { where: { test_id: test.id } }
    );

    // Then set the specified version as default
    const targetVersion = await this.findOne({
      where: { slug: versionSlug, test_id: test.id }
    });

    if (!targetVersion) return null;

    await targetVersion.update({ isDefault: true });
    return targetVersion;
  };

  return TestVersion;
}
