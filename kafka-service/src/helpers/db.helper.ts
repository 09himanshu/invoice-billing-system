import {TableName} from 'sequelize'

// custom import
import {db} from '../db/index.db'

type TableName = Exclude<keyof typeof db, 'sequelize'>;
