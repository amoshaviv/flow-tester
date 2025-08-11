import { Sequelize, DataTypes, Model, ModelStatic, BelongsToManyGetAssociationsMixinOptions } from "sequelize";
import { randomBytes, pbkdf2Sync, createHash } from "crypto";
import { IModels } from ".";
import { IOrganizationInstance } from "./organization";

const getGravatarURL = (email: string, size = 200) => {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = createHash("sha256").update(trimmedEmail).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};
export interface IUserInstance extends Model {
  id: number;
  username: string;
  email: string;
  displayName: string;
  profileImageURL: string;
  provider: string;
  providerId: string;
  providerData: string;
  secret: string;
  password: string;
  authenticate(password: string): boolean;
  updatePassword(password: string): IUserInstance | Promise<IUserInstance>;
  hashPassword(password: string): string;
  getOrganizations(options?: BelongsToManyGetAssociationsMixinOptions): Promise<IOrganizationInstance[]>;
}

export interface IUserModel extends ModelStatic<IUserInstance> {
  associate(models: IModels): void;
  findByEmail(email: string): Promise<IUserInstance | null>;
  findUniqueUsername(possibleUsername: string): Promise<string>;
}

export default function defineUserModel(sequelize: Sequelize): IUserModel {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
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
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    providerData: {
      type: DataTypes.STRING,
    },
    secret: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }) as IUserModel;

  User.associate = function associate(models) {
    const { Organization, UsersOrganizations } = models;

    this.belongsToMany(Organization, {
      as: "organizations",
      through: UsersOrganizations,
      onDelete: "CASCADE",
    });
  };

  User.beforeCreate((user: any) => {
    if (user.password) {
      user.secret = randomBytes(16).toString("base64");
      user.password = user.hashPassword(user.password);
      user.profileImageURL = getGravatarURL(user.email);
    }
  });

  User.findByEmail = function findByEmail(email: string) {
    return this.findOne({
      where: {
        email: email,
      },
    });
  };

  (User.prototype as IUserInstance).authenticate = function (password: string) {
    return this.password === this.hashPassword(password);
  };

  (User.prototype as IUserInstance).updatePassword = function (
    password: string
  ) {
    if (password) {
      this.secret = randomBytes(16).toString("base64");
      this.password = this.hashPassword(password);
      return this.save();
    }
    return this;
  };

  (User.prototype as IUserInstance).hashPassword = function (password: string) {
    if (this.secret && password) {
      return pbkdf2Sync(
        password,
        Buffer.from(this.secret, "base64"),
        10000,
        64,
        "SHA1"
      ).toString("base64");
    }
    return password;
  };

  return User;
}
