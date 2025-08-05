import { DataTypes } from 'sequelize';

export default function defineResetPasswordTokenModel(sequelize: any) {
  const ResetPasswordToken = sequelize.define('ResetPasswordToken', {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    isUsed: {
      field: 'is_used',
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  ResetPasswordToken.associate = function associate(models: any) {
    const { User } = models;

    this.belongsTo(User, {
      as: 'user',
      foreignKey: {
        name: 'user_id',
        allowNull: false,
      },
    });
  };

  ResetPasswordToken.getByToken = async function getByToken(token: any) {
    return this.findOne({
      where: {
        token,
      },
      include: ['user'],
      attributes: ['id', 'isUsed', 'createdAt'],
    });
  };

  ResetPasswordToken.prototype.isValid = function isValid() {
    const aDay = 864e7;
    return !(
      this.isUsed || new Date().getTime() - this.createdAt.getTime() > aDay
    );
  };

  return ResetPasswordToken;
};
