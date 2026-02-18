module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'enquiry'
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'open'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ticketNumber: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Ticket;
};
