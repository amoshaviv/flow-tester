import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
} from "sequelize";
import { IModels } from ".";
import { IUserInstance } from "./user";
import { IOrganizationInstance } from "./organization";
import { kebabCase } from "change-case";

export interface IProjectInstance extends Model {
  id: number;
  slug: string;
  displayName: string;
  profileImageURL: string;
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setOrganization(
    user: IOrganizationInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface IProjectModel extends ModelStatic<IProjectInstance> {
  associate(models: IModels): void;
  findUniqueSlug(
    slug: string,
    organization: IOrganizationInstance
  ): Promise<string>;
  createWithOrganization(
    name: string,
    user: IUserInstance,
    organization: IOrganizationInstance
  ): Promise<IProjectInstance>;
}

export default function defineProjectModel(
  sequelize: Sequelize
): IProjectModel {
  const Project = sequelize.define("Project", {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
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
  }) as IProjectModel;

  Project.associate = function associate(models) {
    const { User, Organization } = models;

    this.belongsTo(models.User, {
      as: "createdBy",
      foreignKey: {
        field: "created_by_user_id",
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

  Project.findUniqueSlug = async function findUniqueSlug(
    possibleSlug: string,
    organization: IOrganizationInstance
  ) {
    // Lookup for possible username
    let project = await this.findOne({
      where: {
        organization_id: organization.id,
        slug: possibleSlug,
      },
    });

    // If not found then return user
    if (!project) return possibleSlug;

    // Otherwise find a possible name that doesn't exist
    let suffix = 0;
    while (project) {
      suffix += 1;
      project = await this.findOne({
        where: {
          organization_id: organization.id,
          slug: possibleSlug + suffix,
        },
      });
    }

    return possibleSlug + suffix;
  };

  Project.createWithOrganization = async function createWithOrganization(
    name: string,
    user: IUserInstance,
    organization: IOrganizationInstance
  ) {
    const possibleSlug = kebabCase(name);
    const slug = await this.findUniqueSlug(possibleSlug, organization);

    const newProject = this.build({ name, slug });
    newProject.setCreatedBy(user, { save: false });
    newProject.setOrganization(organization, { save: false });
    await newProject.save();

    return newProject;
  };

  Project.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "createdAt", "updatedAt", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Project;
}
