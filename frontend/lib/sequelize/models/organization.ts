import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

interface IOrganizationInstance extends Model {
  id: number;
  slug: string;
  displayName: string;
  profileImageURL: string;
}

export interface IOrganizationModel extends ModelStatic<IOrganizationInstance> {
  associate(models: IModels): void;
}

export default function defineOrganizationModel(
  sequelize: Sequelize
): IOrganizationModel {
  const Organization = sequelize.define("Organization", {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    domain: {
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
  }) as IOrganizationModel;

  Organization.associate = function associate(models) {
    const { User } = models;

    this.belongsToMany(User, {
      as: "users",
      through: "organization_users",
      otherKey: "user_id",
      foreignKey: "organization_id",
      onDelete: "CASCADE",
    });

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });
  };

  Organization.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "createdAt", "updatedAt", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Organization;
}
