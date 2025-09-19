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
import { IProjectInstance } from "./project";
import { ITestSuiteVersionInstance } from "./test-suite-version";

export interface ITestSuiteInstance extends Model {
  id: number;
  slug: string;
  versions: ITestSuiteVersionInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setProject(
    project: IProjectInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestSuiteModel extends ModelStatic<ITestSuiteInstance> {
  associate(models: IModels): void;
  createWithUserAndProject(
    user: IUserInstance,
    project: IProjectInstance
  ): Promise<ITestSuiteInstance>;
  findAllByProjectSlug(projectSlug: string): Promise<any[]>;
  findBySlugAndProject(
    suiteSlug: string,
    project: IProjectInstance
  ): Promise<any | null>;
}

export default function defineTestSuiteModel(sequelize: Sequelize): ITestSuiteModel {
  const TestSuite = sequelize.define("TestSuite", {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }) as ITestSuiteModel;

  TestSuite.associate = function associate(models) {
    const { User, Project, TestSuiteVersion } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(Project, {
      as: "project",
      foreignKey: {
        name: "project_id",
        allowNull: false,
      },
    });

    this.hasMany(TestSuiteVersion, {
      as: "versions",
      foreignKey: {
        name: "test_suite_id",
        allowNull: false,
      },
    });
  };

  TestSuite.createWithUserAndProject = async function createWithUserAndProject(
    user: IUserInstance,
    project: IProjectInstance
  ) {
    const slug = ulid();
    const newTestSuite = this.build({ slug });
    newTestSuite.setCreatedBy(user, { save: false });
    newTestSuite.setProject(project, { save: false });
    await newTestSuite.save();

    return newTestSuite;
  };

  TestSuite.findAllByProjectSlug = async function findAllByProjectSlug(
    projectSlug: string
  ) {
    const testSuites = await this.findAll({
      include: [
        {
          association: "project",
          where: { slug: projectSlug },
          attributes: [],
        },
        {
          association: "versions",
          attributes: ["isDefault", "slug", "number", "title", "description"],
          include: [
            {
              association: "runs",
              attributes: ["slug", "status", "modelSlug", "modelProvider"],
            },
          ],
        },
      ],
    });

    return testSuites
      .filter((testSuite) => testSuite.versions.length > 0)
      .map((testSuite) => {
        const defaultTestSuiteVersion = testSuite.versions.find(
          (version) => version.isDefault
        );

        let totalRuns = 0;
        let pendingRuns = 0;
        let successfulRuns = 0;
        let failedRuns = 0;
        testSuite.versions.forEach((version) => {
          version.runs.forEach((testSuiteRun) => {
            totalRuns++;
            if (testSuiteRun.status === "pending") pendingRuns++;
            if (testSuiteRun.status === "succeeded") successfulRuns++;
            if (testSuiteRun.status === "failed") failedRuns++;
          });
        });

        return {
          slug: testSuite.slug,
          title: defaultTestSuiteVersion?.title,
          description: defaultTestSuiteVersion?.description,
          versions: testSuite.versions
            .sort((a, b) => a.number - b.number)
            .map((currentVersion) => ({
              slug: currentVersion.slug,
              title: currentVersion.title,
              description: currentVersion.description,
              number: currentVersion.number,
              isDefault: currentVersion.isDefault,
            })),
          defaultVersion: {
            slug: defaultTestSuiteVersion?.slug,
            title: defaultTestSuiteVersion?.title,
            description: defaultTestSuiteVersion?.description,
            number: defaultTestSuiteVersion?.number,
          },
          totalVersions: testSuite.versions.length,
          totalRuns,
          pendingRuns,
          successfulRuns,
          failedRuns,
        };
      });
  };

  TestSuite.findBySlugAndProject = async function findBySlugAndProject(
    suiteSlug: string,
    project: IProjectInstance
  ) {
    const testSuite = await this.findOne({
      where: { slug: suiteSlug },
      include: [
        {
          association: "project",
          where: { id: project.id },
          attributes: [],
        },
        {
          association: "versions",
          attributes: ["isDefault", "slug", "number", "title", "description"],
          include: [
            {
              association: "runs",
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
                  association: "createdBy",
                  attributes: ["email", "displayName", "profileImageURL"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!testSuite || testSuite.versions.length === 0) return null;

    const defaultTestSuiteVersion = testSuite.versions.find(
      (version) => version.isDefault
    );

    let totalRuns = 0;
    let pendingRuns = 0;
    let runningRuns = 0;
    let successfulRuns = 0;
    let failedRuns = 0;
    testSuite.versions.forEach((version) => {
      version.runs.forEach((testSuiteRun) => {
        totalRuns++;
        if (testSuiteRun.status === "pending") pendingRuns++;
        if (testSuiteRun.status === "running") runningRuns++;
        if (testSuiteRun.status === "succeeded") successfulRuns++;
        if (testSuiteRun.status === "failed") failedRuns++;
      });
    });

    return {
      slug: testSuite.slug,
      title: defaultTestSuiteVersion?.title,
      description: defaultTestSuiteVersion?.description,
      versions: testSuite.versions
        .sort((a, b) => a.number - b.number)
        .map((currentVersion) => ({
          slug: currentVersion.slug,
          title: currentVersion.title,
          description: currentVersion.description,
          number: currentVersion.number,
          isDefault: currentVersion.isDefault,
        })),
      defaultVersion: {
        slug: defaultTestSuiteVersion?.slug,
        title: defaultTestSuiteVersion?.title,
        description: defaultTestSuiteVersion?.description,
        number: defaultTestSuiteVersion?.number,
      },
      totalVersions: testSuite.versions.length,
      totalRuns,
      pendingRuns,
      runningRuns,
      successfulRuns,
      failedRuns,
      runs: testSuite.versions.flatMap((version) =>
        version.runs.map((run) => ({
          slug: run.slug,
          status: run.status,
          modelSlug: run.modelSlug,
          modelProvider: run.modelProvider,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
          version: {
            title: version.title,
            description: version.description,
            number: version.number,
            slug: version.slug,
            testSuite: {
              slug: testSuite.slug,
            },
          },
          createdBy: {
            email: run.createdBy.email,
            displayName: run.createdBy.displayName,
            profileImageURL: run.createdBy.profileImageURL,
          },
        }))
      ),
    };
  };

  return TestSuite;
}