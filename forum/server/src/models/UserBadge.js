module.exports = (sequelize, DataTypes) => {
  const UserBadge = sequelize.define('UserBadge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    badgeSlug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    indexes: [
      { unique: true, fields: ['userId', 'badgeSlug'] },
      { fields: ['badgeSlug'] },
    ],
  });

  return UserBadge;
};
