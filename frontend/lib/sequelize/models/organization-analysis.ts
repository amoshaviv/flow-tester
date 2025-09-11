import {
  Sequelize,
  DataTypes,
  Model,
  ModelStatic,
  BelongsToSetAssociationMixinOptions,
} from "sequelize";
import { IModels } from ".";
import { IOrganizationInstance } from "./organization";

export interface IOrganizationAnalysisInstance extends Model {
  id: number;
  organizationId: number;
  analysisUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  organization: IOrganizationInstance;
}

export interface IOrganizationAnalysisModel extends ModelStatic<IOrganizationAnalysisInstance> {
  associate(models: IModels): void;
  createAnalysis(
    organizationId: number,
    analysisUrl: string
  ): Promise<IOrganizationAnalysisInstance>;
  findByOrganizationId(
    organizationId: number
  ): Promise<IOrganizationAnalysisInstance[]>;
}

export default function defineOrganizationAnalysisModel(
  sequelize: Sequelize
): IOrganizationAnalysisModel {
  const OrganizationAnalysis = sequelize.define("OrganizationAnalysis", {
    analysisUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "analysis_url",
      validate: {
        notEmpty: true,
        isUrl: true,
      },
    },
  }, {
    tableName: "organizations_analyses",
  }) as IOrganizationAnalysisModel;

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

  OrganizationAnalysis.findByOrganizationId = async function findByOrganizationId(
    organizationId: number
  ) {
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

  return OrganizationAnalysis;
}