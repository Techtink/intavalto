const { Sequelize, DataTypes } = require('sequelize');

const dbOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    acquire: 30000,
    idle: 10000,
  },
};

if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
  dbOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    },
  };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, dbOptions)
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      ...dbOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
    });

const db = {};

// Import models
db.User = require('./User')(sequelize, DataTypes);
db.Product = require('./Product')(sequelize, DataTypes);
db.Category = require('./Category')(sequelize, DataTypes);
db.Post = require('./Post')(sequelize, DataTypes);
db.Comment = require('./Comment')(sequelize, DataTypes);
db.Moderator = require('./Moderator')(sequelize, DataTypes);
db.Ticket = require('./Ticket')(sequelize, DataTypes);
db.TicketReply = require('./TicketReply')(sequelize, DataTypes);
db.SiteSettings = require('./SiteSettings')(sequelize, DataTypes);

// Associations
db.User.hasMany(db.Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Post.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Comment.belongsTo(db.User, { foreignKey: 'userId' });

db.Product.hasMany(db.Post, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Post.belongsTo(db.Product, { foreignKey: 'productId' });

db.Category.hasMany(db.Post, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
db.Post.belongsTo(db.Category, { foreignKey: 'categoryId' });

db.Post.hasMany(db.Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
db.Comment.belongsTo(db.Post, { foreignKey: 'postId' });

db.User.hasMany(db.Moderator, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Moderator.belongsTo(db.User, { foreignKey: 'userId' });

db.Product.hasMany(db.Moderator, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Moderator.belongsTo(db.Product, { foreignKey: 'productId' });

db.User.hasMany(db.Ticket, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Ticket.belongsTo(db.User, { foreignKey: 'userId', as: 'Creator' });
db.Ticket.belongsTo(db.User, { foreignKey: 'assignedTo', as: 'Assignee' });

db.Ticket.hasMany(db.TicketReply, { foreignKey: 'ticketId', onDelete: 'CASCADE' });
db.TicketReply.belongsTo(db.Ticket, { foreignKey: 'ticketId' });

db.User.hasMany(db.TicketReply, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.TicketReply.belongsTo(db.User, { foreignKey: 'userId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
