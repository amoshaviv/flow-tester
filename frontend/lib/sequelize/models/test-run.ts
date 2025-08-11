import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

interface ITestRunInstance extends Model {
  id: number;
}

export interface ITestRunModel extends ModelStatic<ITestRunInstance> {
  associate(models: IModels): void;
}

export default function defineTestRunModel(
  sequelize: Sequelize
): ITestRunModel {
  const TestRun = sequelize.define(
    "TestRun",
    {},
    {
      tableName: "tests_runs",
    }
  ) as ITestRunModel;

  TestRun.associate = function associate(models) {
    const { User, TestVersion } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        field: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(TestVersion, {
      as: "version",
      foreignKey: {
        name: "version_id",
        allowNull: false,
      },
    });
  };

  return TestRun;
}
