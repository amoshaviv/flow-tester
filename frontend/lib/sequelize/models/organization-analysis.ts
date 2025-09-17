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
  findLatestByOrganization(
    organization: IOrganizationInstance
  ): Promise<IOrganizationAnalysisInstance | null>;
  findBySlugAndOrganization(
    slug: string,
    organization: IOrganizationInstance
  ): Promise<IOrganizationAnalysisInstance | null>;
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

  OrganizationAnalysis.findLatestByOrganization =
    async function findLatestByOrganization(
      organization: IOrganizationInstance
    ) {
      return this.findOne({
        where: {
          organization_id: organization.id,
        },
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

  OrganizationAnalysis.findBySlugAndOrganization =
    async function findBySlugAndOrganization(
      slug: string,
      organization: IOrganizationInstance
    ) {
      return OrganizationAnalysis.findOne({
        where: { slug },
        include: [
          {
            association: "organization",
            attributes: ["slug", "name"],
            where: {
              id: organization.id,
            },
          },
        ],
      });
    };

  return OrganizationAnalysis;
}
