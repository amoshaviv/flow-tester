import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Op,
} from "sequelize";
import { IModels } from ".";
import { IOrganizationInstance } from "./organization";
import { IUserInstance } from "./user";
import { UserRole } from "./users-organizations";

export interface IInviteInstance extends Model {
  id: number;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: IOrganizationInstance;
  invitedBy: IUserInstance;
  getOrganization: BelongsToGetAssociationMixin<IOrganizationInstance>;
  getInvitedBy: BelongsToGetAssociationMixin<IUserInstance>;
  setOrganization: BelongsToSetAssociationMixin<IOrganizationInstance, number>;
  setInvitedBy: BelongsToSetAssociationMixin<IUserInstance, number>;
  markAsUsed(): Promise<void>;
  isExpired(): boolean;
}

export interface IInviteModel extends ModelStatic<IInviteInstance> {
  associate(models: IModels): void;
  createInvite(
    email: string,
    role: UserRole,
    organization: IOrganizationInstance,
    invitedByUser: IUserInstance
  ): Promise<IInviteInstance>;
  findByToken(token: string): Promise<IInviteInstance | null>;
}

export default function defineInviteModel(sequelize: Sequelize): IInviteModel {
  const Invite = sequelize.define("Invite", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["owner", "admin", "user", "tester"]],
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_used",
    },
  }) as IInviteModel;

  Invite.associate = function associate(models) {
    const { User, Organization } = models;

    this.belongsTo(Organization, {
      as: "organization",
      foreignKey: {
        name: "organization_id",
        allowNull: false,
      },
    });

    this.belongsTo(User, {
      as: "invitedBy",
      foreignKey: {
        name: "invited_by_user_id",
        allowNull: false,
      },
    });
  };

  // Instance methods
  (Invite.prototype as IInviteInstance).markAsUsed = async function () {
    await this.update({ isUsed: true });
  };

  (Invite.prototype as IInviteInstance).isExpired = function () {
    return new Date() > this.expiresAt;
  };

  // Static methods
  Invite.createInvite = async function createInvite(
    email: string,
    role: UserRole,
    organization: IOrganizationInstance,
    invitedByUser: IUserInstance
  ) {
    // Generate a unique token
    const token = require("crypto").randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if there's already a pending invite for this email and organization
    const existingInvite = await this.findOne({
      where: {
        email: email,
        isUsed: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          association: "organization",
          where: { id: organization.id },
          attributes: [],
        },
      ],
    });

    if (existingInvite) {
      existingInvite.set({
        role: role,
        token: token,
        expiresAt: expiresAt,
      });
      existingInvite.setInvitedBy(invitedByUser, { save: false });
      await existingInvite.save();
      return existingInvite;
    }

    // Create new invite using build
    const invite = this.build({
      email: email,
      role: role,
      token: token,
      expiresAt: expiresAt,
      isUsed: false,
    });

    // Set associations before saving
    invite.setOrganization(organization, { save: false });
    invite.setInvitedBy(invitedByUser, { save: false });

    await invite.save();
    return invite;
  };

  Invite.findByToken = async function findByToken(token: string) {
    return await this.findOne({
      where: {
        token: token,
        isUsed: false,
      },
      include: [
        {
          association: "organization",
          attributes: ["slug", "name", "domain"],
        },
        {
          association: "invitedBy",
          attributes: ["displayName", "email", "profileImageURL"],
        },
      ],
    });
  };

  return Invite;
}
