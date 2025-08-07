import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
} from "sequelize";
import { kebabCase } from "change-case";
import { IModels } from ".";
import user, { IUserInstance } from "./user";
export interface IOrganizationInstance extends Model {
  id: number;
  slug: string;
  name: string;
  domain: string;
  profileImageURL: string;
  setCreatedBy(
    user: IUserInstance,
    option: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface IOrganizationModel extends ModelStatic<IOrganizationInstance> {
  associate(models: IModels): void;
  findUniqueSlug(slug: string): Promise<string>;
  createWithUser(
    name: string,
    domain: string,
    user: IUserInstance
  ): Promise<IOrganizationInstance>;
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
    name: {
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
    const { User, Project, UsersOrganizations } = models;

    this.belongsToMany(User, {
      as: "users",
      through: UsersOrganizations,
      onDelete: "CASCADE",
    });

    this.hasMany(Project, {
      as: "projects",
      foreignKey: {
        name: "organization_id",
        allowNull: false,
      },
    });

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });
  };

  Organization.findUniqueSlug = async function findUniqueSlug(
    possibleSlug: string
  ) {
    // Lookup for possible username
    let organization = await this.findOne({
      where: {
        slug: possibleSlug,
      },
    });

    // If not found then return user
    if (!organization) return possibleSlug;

    // Otherwise find a possible name that doesn't exist
    let suffix = 0;
    while (organization) {
      suffix += 1;
      organization = await this.findOne({
        where: {
          username: possibleSlug + suffix,
        },
      });
    }

    return possibleSlug + suffix;
  };

  Organization.createWithUser = async function createWithUser(
    name: string,
    domain: string,
    user: IUserInstance
  ) {
    const possibleSlug = kebabCase(name);
    const slug = this.findUniqueSlug(possibleSlug);
    const newOrganization = this.build({ name, domain, slug });
    newOrganization.setCreatedBy(user, {
      save: false,
    });

    return newOrganization.save();
  };

  Organization.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "createdAt", "updatedAt", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Organization;
}
