import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";

export enum UserRole {
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


  UsersOrganizations.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return UsersOrganizations;
}
