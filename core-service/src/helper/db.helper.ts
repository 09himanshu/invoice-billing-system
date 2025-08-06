// custom import
import { db } from '../db/index.db'
import { FindOptions, } from 'sequelize'

type TableName = Exclude<keyof typeof db, 'sequelize'>;
type TableModel<T extends TableName> = typeof db[T];

// interface for all kind of db queries
interface FindOne<T extends TableName> {
  table: T;
  query: FindOptions;
}

interface FindAll<T extends TableName> {
  table: T;
  query: FindOptions
}

interface CreateOne<T extends TableName> {
  table: T
  data: object
}

export const findOne = async <T extends TableName>({ table, query }: FindOne<T>) => {
  try {
    const model = db[table] as TableModel<T>;
    const result = await model.findOne(query);
    return result;
  } catch (err) {
    console.error(`Error in findOne for table "${table}":`, err);
    throw err;
  }
}


export const findAll = async <T extends TableName>({ table, query }: FindAll<T>) => {
  try {
    const model = db[table] as TableModel<T>;
    const result = await model.findAll(query);
    return result;
  } catch (err) {
    console.error(`Error in findOne for table "${table}":`, err);
    throw err;
  }
}

export const createOne = async <T extends TableName>({ table, data }: CreateOne<T>) => {
  try {
    const model = db[table] as TableModel<T>;
    const result = await db.sequelize.transaction(async (t) => {
      return await model.create({ ...data }, { transaction: t });
    });
    return result;
  } catch (err) {
    console.error(`Error in createOne for table "${table}":`, err);
    throw err;
  }
};