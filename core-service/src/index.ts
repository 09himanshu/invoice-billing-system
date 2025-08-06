import express, { Request, Response } from "express"
import helmet from 'helmet'
import cors from 'cors'

// custom imports
import {env} from "./config/env.config"
import {errorMiddleware} from './middleware/error.middleware'
import {helmetUtils} from './utils/helmet.utils'
import {db} from './db/index.db'

// imports routes
import routes from './routes/index'

async function connectDB() {
  try {
    await db.sequelize.authenticate()
    await db.sequelize.sync({alter: false})
    console.log('Connection has been established successfully.')
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
}

(async (): Promise<void> => {
  const app = express()
  try {
    // Middlewares
    app.use(express.json())
    app.use(cors()) 

    // use master routes
    app.use('/api/v1', routes)

    // Security with Helmet
    if (process.env.NODE_ENV === 'development') {
      app.use(helmet(helmetUtils.development))
    } else {
      app.use(helmet(helmetUtils.production))
    }

    await connectDB()


    // Error handling middleware should be last
    app.use(errorMiddleware)

    const PORT = Number(env.PORT)
    const HOST = String(env.HOST)

    app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`)
    })

  } catch (err) {
    console.error("Error during initialization:", err)
    process.exit(1)
  }
})()