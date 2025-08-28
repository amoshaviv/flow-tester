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
import { ITestVersionInstance } from "./test-version";
import { TestRunStatus } from "./test-run";

export interface ITestInstance extends Model {
  id: number;
  slug: string;
  versions: ITestVersionInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setProject(
    project: IProjectInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface ITestModel extends ModelStatic<ITestInstance> {
  associate(models: IModels): void;
  createWithUserAndProject(
    user: IUserInstance,
    project: IProjectInstance
  ): Promise<ITestInstance>;
  findAllByProjectSlug(projectSlug: string): Promise<any[]>;
}

export default function defineTestModel(sequelize: Sequelize): ITestModel {
  const Test = sequelize.define("Test", {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }) as ITestModel;

  Test.associate = function associate(models) {
    const { User, Project, TestVersion } = models;

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

    this.hasMany(TestVersion, {
      as: "versions",
      foreignKey: {
        name: "test_id",
        allowNull: false,
      },
    });
  };

  Test.createWithUserAndProject = async function createWithUserAndProject(
    user: IUserInstance,
    project: IProjectInstance
  ) {
    const slug = ulid();
    const newTest = this.build({ slug });
    newTest.setCreatedBy(user, { save: false });
    newTest.setProject(project, { save: false });
    await newTest.save();

    return newTest;
  };

  Test.findAllByProjectSlug = async function findAllByProjectSlug(
    projectSlug: string
  ) {
    const tests = await this.findAll({
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

    return tests
      .filter((test) => test.versions.length > 0)
      .map((test) => {
        const defaultTestVersion = test.versions.find(
          (version) => version.isDefault
        );

        let totalRuns = 0; 
        let pendingRuns = 0;
        let successfulRuns = 0;
        let failedRuns = 0;
        test.versions.forEach(version => {
          version.runs.forEach(testRun => {
            totalRuns++;
            if (testRun.status === TestRunStatus.Pending) pendingRuns++;
            if (testRun.status === TestRunStatus.Succeeded) successfulRuns++;
            if (testRun.status === TestRunStatus.Failed) failedRuns++;
          })
        })

        return {
          slug: test.slug,
          title: defaultTestVersion?.title,
          description: defaultTestVersion?.description,
          versions: test.versions.map((currentVersion) => ({
            slug: currentVersion.slug,
            title: currentVersion.title,
            description: currentVersion.description,
            number: currentVersion.number,
            isDefault: currentVersion.isDefault,
          })),
          defaultVersion: {
            slug: defaultTestVersion?.slug,
            title: defaultTestVersion?.title,
            description: defaultTestVersion?.description,
            number: defaultTestVersion?.number,
          },
          totalVersions: test.versions.length,
          totalRuns,
          pendingRuns,
          successfulRuns,
          failedRuns,
        };
      });
  };

  return Test;
}
