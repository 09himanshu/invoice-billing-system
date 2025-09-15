import { InferAttributes, FindOptions } from "sequelize";
// custom import
import { db } from "../db/index.db";

type TableName = Exclude<keyof typeof db, "sequelize">;
type TableModel<T extends TableName> = (typeof db)[T];

// interface for all kind of db queries

interface FindOne<T extends TableName> {
  table: T;
  query: FindOptions;
}

interface CreateOne<T extends TableName> {
  table: T;
  data: InferAttributes<InstanceType<TableModel<T>>>;
}

interface CreateMany<T extends TableName> {
  table: T;
  data: InferAttributes<InstanceType<TableModel<T>>>[];
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

export const createOne = async <T extends TableName>({
  table,
  data,
}: CreateOne<T>) => {
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

export const createMany = async <T extends TableName>({
  table,
  data,
}: CreateMany<T>) => {
  try {
    const model = db[table] as TableModel<T>;
    const result = await db.sequelize.transaction(async (t) => {
      return await model.bulkCreate(data, { transaction: t });
    });
    return result;
  } catch (err) {
    console.error(`Error in createMany for table "${table}":`, err);
    throw err;
  }
};
