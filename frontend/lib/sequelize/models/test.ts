import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

interface ITestInstance extends Model {
  id: number;
  title: string;
  description: string;
}

export interface ITestModel extends ModelStatic<ITestInstance> {
  associate(models: IModels): void;
}

export default function defineTestModel(
  sequelize: Sequelize
): ITestModel {
  const Test = sequelize.define("Test", {
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
  }) as ITestModel;

  Test.associate = function associate(models) {
    const { User, Project } = models;

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
  };

  Test.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Test;
}
