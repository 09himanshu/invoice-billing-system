import { InferAttributes } from "sequelize";
// custom import
import { db } from "../db/index.db";

type TableName = Exclude<keyof typeof db, "sequelize">;
type TableModel<T extends TableName> = (typeof db)[T];

// interface for all kind of db queries

interface CreateOne<T extends TableName> {
  table: T;
  data: InferAttributes<InstanceType<TableModel<T>>>;
}

interface CreateMany<T extends TableName> {
  table: T;
  data: InferAttributes<InstanceType<TableModel<T>>>[];
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
