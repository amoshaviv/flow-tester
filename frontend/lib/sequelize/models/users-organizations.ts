import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IOrganizationInstance } from "./organization";
import { IUserInstance } from "./user";
import { IModels } from ".";

export enum UserRole {
  Owner = "owner",
  Admin = "admin",
  User = "user",
  Tester = "tester",
}

interface UserWithRole {
  displayName: string;
  profileImageURL: string;
  email: string;
  role: UserRole;
}

interface IUsersOrganizationsInstance extends Model {
  role: UserRole;
  user: IUserInstance;
}

export interface IUsersOrganizationsModel
  extends ModelStatic<IUsersOrganizationsInstance> {
  associate(models: IModels): void;

  getUsersByOrganizationWithRoles(
    organization: IOrganizationInstance
  ): Promise<UserWithRole[]>;
}

export default function defineUsersOrganizationsModel(
  sequelize: Sequelize
): IUsersOrganizationsModel {
  const UsersOrganizations = sequelize.define("UsersOrganizations", {
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }) as IUsersOrganizationsModel;

  UsersOrganizations.associate = function associate(models) {
    const { User, Organization } = models;

    this.belongsTo(User, {
      as: "user",
    });
    
    this.belongsTo(Organization, {
      as: "organization",
    });
  };

  UsersOrganizations.getUsersByOrganizationWithRoles =
    async function getUsersByOrganizationWithRoles(
      organization: IOrganizationInstance
    ) {
      const organizationUsers = await this.findAll({
        where: {
          organization_id: organization.id,
        },
        include: {
          association: "user",
          attributes: ["email", "displayName", "profileImageURL"],
        },
      });

      return organizationUsers.map((organizationUser) => ({
        email: organizationUser.user.email,
        displayName: organizationUser.user.displayName,
        profileImageURL: organizationUser.user.profileImageURL,
        role: organizationUser.role,
      }));
    };

  return UsersOrganizations;
}
