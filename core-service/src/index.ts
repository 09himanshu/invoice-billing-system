import express, { Request, Response } from "express"
import helmet from 'helmet'
import cors from 'cors'

// custom imports
import {env} from "./config/env.config"
import {errorMiddleware} from './middleware/error.middleware'
import {helmetUtils} from './utils/helmet.utils'
import userRoutes from './routes/user.routes'

(async (): Promise<void> => {
  const app = express()
  try {
    // Middlewares
    app.use(express.json())
    app.use(cors()) 

    // Security with Helmet
    if (process.env.NODE_ENV === 'development') {
      app.use(helmet(helmetUtils.development))
    } else {
      app.use(helmet(helmetUtils.production))
    }

    // API Routes
    app.use('/api/v1/users', userRoutes);


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