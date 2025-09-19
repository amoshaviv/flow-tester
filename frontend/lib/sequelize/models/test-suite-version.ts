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
import { ITestSuiteInstance } from "./test-suite";
import { ITestSuiteRunInstance } from "./test-suite-run";

export interface ITestSuiteVersionInstance extends Model {
  id: number;
  slug: string;
  title: string;
  description: string;
  number: number;
  isDefault: boolean;
  testSuite: ITestSuiteInstance;
  runs: ITestSuiteRunInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setTestSuite(
    testSuite: ITestSuiteInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestSuiteVersionModel extends ModelStatic<ITestSuiteVersionInstance> {
  associate(models: IModels): void;
  createWithTestSuite(
    title: string,
    description: string,
    user: IUserInstance,
    testSuite: ITestSuiteInstance,
    isDefault: boolean
  ): Promise<ITestSuiteVersionInstance>;
  findNextVersionNumber(testSuite: ITestSuiteInstance): Promise<number>;
  findOneBySlugAndTestSuite(slug: string, testSuite: ITestSuiteInstance): Promise<ITestSuiteVersionInstance | null>;
  setAsDefault(versionSlug: string, testSuite: ITestSuiteInstance): Promise<ITestSuiteVersionInstance | null>;
}

export default function defineTestSuiteVersionModel(
  sequelize: Sequelize
): ITestSuiteVersionModel {
  const TestSuiteVersion = sequelize.define(
    "TestSuiteVersion",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
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
      tableName: "test_suites_versions",
    }
  ) as ITestSuiteVersionModel;

  TestSuiteVersion.associate = function associate(models) {
    const { User, TestSuite, TestSuiteRun, Test, TestSuiteTest } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(TestSuite, {
      as: "testSuite",
      foreignKey: {
        name: "test_suite_id",
        allowNull: false,
      },
    });

    this.hasMany(TestSuiteRun, {
      as: "runs",
      foreignKey: {
        name: "test_suite_version_id",
        allowNull: false,
      },
    });

    this.belongsToMany(Test, {
      through: TestSuiteTest,
      as: "tests",
      foreignKey: "test_suite_version_id",
      otherKey: "test_id",
    });
  };

  TestSuiteVersion.findOneBySlugAndTestSuite = async function findOneBySlugAndTestSuite(
    slug: string,
    testSuite: ITestSuiteInstance
  ) {
    return this.findOne({ where: {slug}, include: [{
      association: 'testSuite',
      where: { id: testSuite.id }
    }]})
  };

  TestSuiteVersion.findNextVersionNumber = async function findNextVersionNumber(
    testSuite: ITestSuiteInstance
  ) {
    let latestVersion = await this.findOne({
      where: {
        test_suite_id: testSuite.id,
      },
      order: [["number", "DESC"]],
    });

    if (latestVersion) return latestVersion.number + 1;
    return 1;
  };

  TestSuiteVersion.createWithTestSuite = async function createWithTestSuite(
    title: string,
    description: string,
    user: IUserInstance,
    testSuite: ITestSuiteInstance,
    isDefault: boolean
  ) {
    const number = await this.findNextVersionNumber(testSuite);
    const slug = ulid();
    const newTestSuiteVersion = this.build({ title, description, number, slug, isDefault });

    if (!isDefault) {
      await this.update(
        { isDefault: false },
        { where: { test_suite_id: testSuite.id } }
      );
    }

    newTestSuiteVersion.setCreatedBy(user, { save: false });
    newTestSuiteVersion.setTestSuite(testSuite, { save: false });
    await newTestSuiteVersion.save();

    return newTestSuiteVersion;
  };

  TestSuiteVersion.setAsDefault = async function setAsDefault(
    versionSlug: string,
    testSuite: ITestSuiteInstance
  ) {
    await this.update(
      { isDefault: false },
      { where: { test_suite_id: testSuite.id } }
    );

    const targetVersion = await this.findOne({
      where: { slug: versionSlug, test_suite_id: testSuite.id }
    });

    if (!targetVersion) return null;

    await targetVersion.update({ isDefault: true });
    return targetVersion;
  };

  return TestSuiteVersion;
}