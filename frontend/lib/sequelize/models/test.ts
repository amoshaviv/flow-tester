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

export interface ITestInstance extends Model {
  id: number;
  slug: string;
  versions: ITestVersionInstance[],
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
  findAllByProjectSlug(projectSlug: string): Promise<ITestInstance[]>;
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
    return this.findAll({
      include: [
        {
          association: "project",
          where: { slug: projectSlug },
          attributes: [],
        },
        {
          association: "versions",
          attributes: ["isDefault", "slug", "number", "title", "description"],
        },
      ],
    });
  };

  return Test;
}
