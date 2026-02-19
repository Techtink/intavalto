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
    // Email (SMTP) Configuration
    smtpHost: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    smtpUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailFromAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailFromName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // SMS (Termii) Configuration
    termiiApiKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    termiiSenderId: {
      type: DataTypes.STRING(11),
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
