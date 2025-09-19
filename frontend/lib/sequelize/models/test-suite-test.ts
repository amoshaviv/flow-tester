import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";
import { ITestSuiteVersionInstance } from "./test-suite-version";
import { ITestInstance } from "./test";

export interface ITestSuiteTestInstance extends Model {
  id: number;
  testSuiteVersionId: number;
  testId: number;
  testSuiteVersion: ITestSuiteVersionInstance;
  test: ITestInstance;
}

export interface ITestSuiteTestModel
  extends ModelStatic<ITestSuiteTestInstance> {
  associate(models: IModels): void;
  findTestsByTestSuiteVersion(testSuiteVersionId: number): Promise<any[]>;
  findTestSuiteVersionsByTest(testId: number): Promise<any[]>;
  addTestToSuiteVersion(
    testSuiteVersion: ITestSuiteVersionInstance,
    test: ITestInstance
  ): Promise<ITestSuiteTestInstance>;
  removeTestFromSuiteVersion(
    testSuiteVersionId: number,
    testId: number
  ): Promise<number>;
}

export default function defineTestSuiteTestModel(
  sequelize: Sequelize
): ITestSuiteTestModel {
  const TestSuiteTest = sequelize.define(
    "TestSuiteTest",
    {},
    {
      tableName: "test_suites_tests",
    }
  ) as ITestSuiteTestModel;

  TestSuiteTest.associate = function associate(models) {
    const { TestSuiteVersion, Test } = models;

    this.belongsTo(TestSuiteVersion, {
      as: "testSuiteVersion",
      foreignKey: {
        name: "test_suite_version_id",
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
  };

  TestSuiteTest.findTestsByTestSuiteVersion =
    async function findTestsByTestSuiteVersion(testSuiteVersionId: number) {
      const testSuiteTests = await this.findAll({
        where: { test_suite_version_id: testSuiteVersionId },
        include: [
          {
            association: "test",
            attributes: ["id", "slug"],
            include: [
              {
                association: "versions",
                attributes: [
                  "isDefault",
                  "slug",
                  "number",
                  "title",
                  "description",
                ],
                where: { isDefault: true },
                required: false,
              },
            ],
          },
        ],
      });

      return testSuiteTests.map((testSuiteTest) => ({
        id: testSuiteTest.test.id,
        slug: testSuiteTest.test.slug,
        defaultVersion: testSuiteTest.test.versions?.[0] || null,
      }));
    };

  TestSuiteTest.findTestSuiteVersionsByTest =
    async function findTestSuiteVersionsByTest(testId: number) {
      const testSuiteTests = await this.findAll({
        where: { testId },
        include: [
          {
            association: "testSuiteVersion",
            attributes: [
              "id",
              "slug",
              "title",
              "description",
              "number",
              "isDefault",
            ],
            include: [
              {
                association: "testSuite",
                attributes: ["id", "slug"],
              },
            ],
          },
        ],
      });

      return testSuiteTests.map((testSuiteTest) => ({
        id: testSuiteTest.testSuiteVersion.id,
        slug: testSuiteTest.testSuiteVersion.slug,
        title: testSuiteTest.testSuiteVersion.title,
        description: testSuiteTest.testSuiteVersion.description,
        number: testSuiteTest.testSuiteVersion.number,
        isDefault: testSuiteTest.testSuiteVersion.isDefault,
        testSuite: {
          id: testSuiteTest.testSuiteVersion.testSuite.id,
          slug: testSuiteTest.testSuiteVersion.testSuite.slug,
        },
      }));
    };

  TestSuiteTest.addTestToSuiteVersion = async function addTestToSuiteVersion(
    testSuiteVersion: ITestSuiteVersionInstance,
    test: ITestInstance
  ) {
    const newTest = this.build({});
    newTest.setTestSuiteVersion(testSuiteVersion, { save: false });
    newTest.setTest(test, { save: false });
    return newTest.save();
  };

  TestSuiteTest.removeTestFromSuiteVersion =
    async function removeTestFromSuiteVersion(
      testSuiteVersionId: number,
      testId: number
    ) {
      return this.destroy({
        where: {
          testSuiteVersionId,
          testId,
        },
      });
    };

  return TestSuiteTest;
}
