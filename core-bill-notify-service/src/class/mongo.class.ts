import {MongoClient, Db, ServerApiVersion, Document, ObjectId} from 'mongodb'
import {env} from '../config/env.config'

interface Find {
  collection: string,
  filter: Document,
  project?: Document,
  optionals?: {
    limit?: number,
    skip?: number,
    sort?: Document
  }
}

interface FindOne {
  collection: string,
  filter: Document,
  project: Document,
}

interface InsertOne {
  collection: string,
  document: Document
}

interface InsertMany {
  collection: string,
  document: Document[]
}

interface updateOne {
  collection: string,
  filter: Document,
  update: Document
}

interface deleteOne {
  collection: string,
  filter: Document,
}

interface aggegrate {
  collection: string,
  document: Document[]
}

class DB {
  private static instance: DB
  private db_name: string
  private client: MongoClient

  public constructor () {
    this.db_name = env.dbName
    this.client = new MongoClient(env.DB_URL,{
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    })
    this.connection()
  }

  public static async getInstance(): Promise<DB> {
    if(!DB.instance) {
      DB.instance = new DB()
    }
    return DB.instance
  }

  async connection(): Promise<void> {
    try {
      await this.client.connect();
      console.log(`MongoDB connected successfully`);
    } catch (err) {
      console.error("Database connection failed", err)
      throw err
    }
  }

  private get_db_name(): Db {
    return this.client.db(this.db_name);
  }

  public async find({collection, filter, project = {}, optionals = {}}: Find): Promise<Document[]> {
    try {
      if(!collection || typeof collection !== 'string') return [] 
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)
      const {limit = 100, skip = 0, sort = {}} = optionals
  
      return await this.get_db_name()
      .collection(collection)
      .find(filter)
      .project(project)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray()
    } catch (err) {
      console.log(err);
      return []
    }
  }

  public async findOne({collection, filter, project = {}}: FindOne): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)

      return await this.get_db_name()
      .collection(collection)
      .findOne(filter,project)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async insertOne({collection,document}: InsertOne): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      return await this.get_db_name()
      .collection(collection)
      .insertOne(document)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async insertMany({collection, document}: InsertMany): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      let result = await this.get_db_name().collection(collection).insertMany(document)
      console.log(result)
      return result
      // return await this.get_db_name()
      // .collection(collection)
      // .insertMany(document)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async updateOne({collection, filter, update}: updateOne): Promise<Document | null > {
    try {
      if(!collection || typeof collection !== 'string') return null
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)

      return await this.get_db_name()
      .collection(collection)
      .updateOne(filter,update)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async updateMany({collection,filter,update}: updateOne): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)
        return await this.get_db_name()
      .collection(collection)
      .updateMany(filter,update)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async deleteOne({collection, filter}: deleteOne): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)
      
      return await this.get_db_name()
      .collection(collection)
      .deleteOne(filter)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async deleteMany({collection, filter}: deleteOne): Promise<Document | null> {
    try {
      if(!collection || typeof collection !== 'string') return null
      if(filter && typeof filter._id == 'string') filter._id = new ObjectId(filter._id)

      return await this.get_db_name()
      .collection(collection)
      .deleteMany(filter)
    } catch (err) {
      console.log(err);
      return null
    }
  }

  public async aggegrate({collection,document}: aggegrate): Promise<Document[]> {
    try {
      if(!collection || typeof collection !== 'string') return []

      return await this.get_db_name()
      .aggregate(document).toArray()
    } catch (err) {
      console.log(err);
      return []
    }
  }
}


export {DB}