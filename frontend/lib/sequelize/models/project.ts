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
  name: string;
  profileImageURL: string;
  setCreatedBy(
    user: IUserInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  setOrganization(
    organization: IOrganizationInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
  getOrganization(): Promise<IOrganizationInstance>;
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
  findBySlugAndOrganizationSlug(
    projectSlug: string,
    organizationSlug: string
  ): Promise<IProjectInstance | null>;
  updateProjectDetails(
    project: IProjectInstance,
    name: string,
    slug: string
  ): Promise<{ success: boolean; project?: IProjectInstance; suggestedSlug?: string; error?: string }>;
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
    const { User, Organization, Test } = models;

    this.belongsTo(User, {
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

    this.hasMany(Test, {
      as: "tests",
      foreignKey: {
        name: "project_id",
        allowNull: false,
      },
    });
  };

  Project.findBySlugAndOrganizationSlug =
    async function findBySlugAndOrganizationSlug(
      projectSlug: string,
      organizationSlug: string
    ) {
      return await this.findOne({
        where: {
          slug: projectSlug,
        },
        include: [
          {
            association: "organization",
            where: {
              slug: organizationSlug,
            },
            attributes: [], 
          },
        ],
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
    return newProject.save();
  };

  Project.updateProjectDetails = async function updateProjectDetails(
    project: IProjectInstance,
    name: string,
    slug: string
  ) {
    // Get the organization to check slug uniqueness
    const organization = await project.getOrganization();
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    // If slug is different from current, check if it's unique
    if (slug !== project.slug) {
      const existingProject = await this.findOne({
        where: {
          organization_id: organization.id,
          slug: slug,
        },
      });

      if (existingProject) {
        const suggestedSlug = await this.findUniqueSlug(slug, organization);
        return { 
          success: false, 
          error: `Slug "${slug}" is already taken`,
          suggestedSlug 
        };
      }
    }

    // Update the project
    await project.update({ name, slug });
    return { success: true, project };
  };

  return Project;
}
