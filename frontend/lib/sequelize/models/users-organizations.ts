import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";

export enum UserRole {
  Owner = "owner",
  Admin = "admin",
  User = "user",
  Tester = "tester",
}

interface IUsersOrganizationsInstance extends Model {
  role: UserRole;
}

export interface IUsersOrganizationsModel
  extends ModelStatic<IUsersOrganizationsInstance> {
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

  return UsersOrganizations;
}
