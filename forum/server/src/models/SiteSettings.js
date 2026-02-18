module.exports = (sequelize, DataTypes) => {
  const SiteSettings = sequelize.define('SiteSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bannerEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bannerImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bannerTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bannerSubtitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loginWallpaperUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'SiteSettings',
  });

  return SiteSettings;
};
