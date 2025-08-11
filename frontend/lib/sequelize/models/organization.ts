import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
  BelongsToManyAddAssociationMixinOptions,
  col,
  literal,
} from "sequelize";
import { kebabCase } from "change-case";
import { IModels } from ".";
import { IUserInstance } from "./user";
import { IProjectInstance } from "./project";
import { UserRole } from "./users-organizations";
export interface IOrganizationInstance extends Model {
  id: number;
  slug: string;
  name: string;
  domain: string;
  profileImageURL: string;
  projects: IProjectInstance[];
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  addUser(
    user: IUserInstance,
    options: BelongsToManyAddAssociationMixinOptions
  ): Promise<void>;
}

export interface IOrganizationModel extends ModelStatic<IOrganizationInstance> {
  associate(models: IModels): void;
  findUniqueSlug(slug: string): Promise<string>;
  findBySlugAndUserEmail(
    slug: string,
    email: string
  ): Promise<IOrganizationInstance | null>;
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

    this.belongsTo(models.User, {
      as: "createdBy",
      foreignKey: {
        field: "created_by_user_id",
        allowNull: false,
      },
    });
  };

  Organization.findBySlugAndUserEmail = async function findBySlug(
    slug: string,
    email: string
  ) {
    return this.findOne({
      where: {
        slug: slug,
      },
      include: {
        association: "users",
        where: { email: email },
        attributes: [], 
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
          slug: possibleSlug + suffix,
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
    const slug = await this.findUniqueSlug(possibleSlug);

    const newOrganization = this.build({ name, domain, slug });
    newOrganization.setCreatedBy(user, { save: false });
    await newOrganization.save();

    await newOrganization.addUser(user, { through: { role: UserRole.Owner } });

    await newOrganization.reload({
      include: [
        {
          association: "users",
          attributes: [
            "email",
            "displayName",
            "profileImageURL",
            [literal('"users->UsersOrganizations"."role"'), "role"],
          ],
          through: { attributes: [] },
        },
      ],
    });

    return newOrganization;
  };

  return Organization;
}
