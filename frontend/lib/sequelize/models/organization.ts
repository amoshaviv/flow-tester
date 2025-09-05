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
  getProjects(): Promise<IProjectInstance[]>;
}

export interface IOrganizationModel extends ModelStatic<IOrganizationInstance> {
  associate(models: IModels): void;
  findUniqueSlug(slug: string): Promise<string>;
  findBySlugAndUserEmail(
    slug: string,
    email: string
  ): Promise<IOrganizationInstance | null>;
  findBySlugAndUserEmailWithRole(
    slug: string,
    email: string
  ): Promise<{ organization: IOrganizationInstance; userRole: string } | null>;
  addUserToOrganization(
    organization: IOrganizationInstance,
    user: IUserInstance,
    role: string
  ): Promise<{ success: boolean; user?: any; error?: string }>;
  createWithUser(
    name: string,
    domain: string,
    user: IUserInstance
  ): Promise<IOrganizationInstance>;
  updateOrganizationDetails(
    organization: IOrganizationInstance,
    name: string,
    slug: string,
    domain: string,
    profileImageURL?: string
  ): Promise<{ success: boolean; organization?: IOrganizationInstance; suggestedSlug?: string; error?: string }>;
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
        is: {
          args: /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
          msg: "Domain must be a valid domain format (e.g., example.com)"
        }
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

  Organization.updateOrganizationDetails = async function updateOrganizationDetails(
    organization: IOrganizationInstance,
    name: string,
    slug: string,
    domain: string,
    profileImageURL?: string
  ) {
    // If slug is different from current, check if it's unique
    if (slug !== organization.slug) {
      const existingOrganization = await this.findOne({
        where: {
          slug: slug,
        },
      });

      if (existingOrganization) {
        const suggestedSlug = await this.findUniqueSlug(slug);
        return { 
          success: false, 
          error: `Slug "${slug}" is already taken`,
          suggestedSlug 
        };
      }
    }

    // If domain is different from current, check if it's unique
    if (domain !== organization.domain) {
      const existingOrganizationWithDomain = await this.findOne({
        where: {
          domain: domain,
        },
      });

      if (existingOrganizationWithDomain) {
        return { 
          success: false, 
          error: `Domain "${domain}" is already taken`
        };
      }
    }

    // Prepare update data
    const updateData: any = { name, slug, domain };
    if (profileImageURL !== undefined) {
      updateData.profileImageURL = profileImageURL;
    }

    // Update the organization
    await organization.update(updateData);
    return { success: true, organization };
  };

  Organization.findBySlugAndUserEmailWithRole = async function findBySlugAndUserEmailWithRole(
    slug: string,
    email: string
  ) {
    const result = await this.findOne({
      where: {
        slug: slug,
      },
      include: {
        association: "users",
        where: { email: email },
        attributes: ["email"],
        through: {
          attributes: ["role"],
        },
      },
    });

    if (!result) return null;

    const userRole = (result as any).users[0]?.UsersOrganizations?.role;
    return {
      organization: result,
      userRole: userRole || "user",
    };
  };

  Organization.addUserToOrganization = async function addUserToOrganization(
    organization: IOrganizationInstance,
    user: IUserInstance,
    role: string
  ) {
    // Check if user is already in organization using ORM
    const existingUsers = await organization.getUsers({
      where: {
        id: user.id,
      },
    });

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "User is already a member of this organization" };
    }

    // Add user to organization
    await organization.addUser(user, { through: { role } });

    return {
      success: true,
      user: {
        email: user.email,
        displayName: user.displayName,
        profileImageURL: user.profileImageURL,
        role,
      },
    };
  };

  return Organization;
}
