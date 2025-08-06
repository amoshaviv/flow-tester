import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

interface IProjectInstance extends Model {
  id: number;
  slug: string;
  displayName: string;
  profileImageURL: string;
}

export interface IProjectModel extends ModelStatic<IProjectInstance> {
  associate(models: IModels): void;
}

export default function defineProjectModel(
  sequelize: Sequelize
): IProjectModel {
  const Project = sequelize.define("Project", {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    profileImageURL: {
      type: DataTypes.STRING,
      field: "profile_image_url",
    },
  }) as IProjectModel;

  Project.associate = function associate(models) {
    const { User, Organization } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(Organization, {
      as: "organization",
      foreignKey: {
        name: "organization_id",
        allowNull: false,
      },
    });
  };

  Project.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "createdAt", "updatedAt", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Project;
}
