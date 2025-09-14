import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
} from "sequelize";
import { ulid } from "ulid";
import { IModels } from ".";
import { IOrganizationInstance } from "./organization";

export enum OrganizationAnalysisStatus {
  Pending = "pending",
  Running = "running",
  Failed = "failed",
  Succeeded = "succeeded",
}

export interface IOrganizationAnalysisInstance extends Model {
  id: number;
  slug: string;
  status: OrganizationAnalysisStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  organization: IOrganizationInstance;
  setOrganization(
    organization: IOrganizationInstance,
    options: BelongsToSetAssociationMixinOptions
  ): void;
}

export interface IOrganizationAnalysisModel
  extends ModelStatic<IOrganizationAnalysisInstance> {
  associate(models: IModels): void;
  createWithOrganization(
    organization: IOrganizationInstance
  ): Promise<IOrganizationAnalysisInstance>;
  findByOrganizationId(
    organizationId: number
  ): Promise<IOrganizationAnalysisInstance[]>;
}

export default function defineOrganizationAnalysisModel(
  sequelize: Sequelize
): IOrganizationAnalysisModel {
  const OrganizationAnalysis = sequelize.define(
    "OrganizationAnalysis",
    {
      slug: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "organizations_analyses",
    }
  ) as IOrganizationAnalysisModel;

  OrganizationAnalysis.associate = function associate(models) {
    const { Organization } = models;

    this.belongsTo(Organization, {
      as: "organization",
      foreignKey: {
        name: "organization_id",
        allowNull: false,
      },
    });
  };

  OrganizationAnalysis.findByOrganizationId =
    async function findByOrganizationId(organizationId: number) {
      return this.findAll({
        where: {
          organizationId,
        },
        include: [
          {
            association: "organization",
            attributes: ["id", "slug", "name", "domain"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    };

  OrganizationAnalysis.createWithOrganization =
    async function createWithOrganization(organization: IOrganizationInstance) {
      const slug = ulid();
      const newAnalysis = this.build({
        slug,
        status: OrganizationAnalysisStatus.Pending,
      });
      newAnalysis.setOrganization(organization, { save: false });
      return newAnalysis.save();
    };

  return OrganizationAnalysis;
}
