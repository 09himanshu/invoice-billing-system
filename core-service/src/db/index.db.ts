import { Sequelize } from 'sequelize';

// custom import
import user from './user.db'
import { env } from '../config/env.config';


console.log(env)

const sequelize = new Sequelize(env.DB_URL, {
  dialect: env.dialect,
  logging: env.logging === 'true' ? console.log : false,
  dialectOptions: {
    connectTimeout: env.connectTimeout,
  },
  pool: {
    max: Number(env.poolMax),
    min: Number(env.poolMin),
    acquire: Number(env.poolAcquire),
    idle: Number(env.poolIdle)
  }
});

const db = {};
db.sequelize = sequelize;
db.User = user(sequelize);

export default db;