import { Dialect, Sequelize } from 'sequelize'

// custom import
import {env} from '../config/env.config'
import User from './user.db'

const sequelize = new Sequelize(env.DB_URL, {
  dialect: env.dialect as Dialect,
  logging: false
})


export const db = {
  sequelize,
  User: User(sequelize)
}