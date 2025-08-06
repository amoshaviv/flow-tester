import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

interface IRunInstance extends Model {
  id: number;
}

export interface IRunModel extends ModelStatic<IRunInstance> {
  associate(models: IModels): void;
}

export default function defineRunModel(sequelize: Sequelize): IRunModel {
  const Run = sequelize.define("Run", {}) as IRunModel;

  Run.associate = function associate(models) {
    const { User, Test } = models;

    this.belongsTo(User, {
      as: "createdBy",
      foreignKey: {
        name: "created_by_user_id",
        allowNull: false,
      },
    });

    this.belongsTo(Test, {
      as: "test",
      foreignKey: {
        name: "test_id",
        allowNull: false,
      },
    });
  };

  Run.prototype.toJSON = function toJSON() {
    const output = Object.assign({}, this.get());

    const excludedFields = ["id", "deletedAt"];

    excludedFields.forEach((excludedField) => delete output[excludedField]);
    return output;
  };

  return Run;
}
