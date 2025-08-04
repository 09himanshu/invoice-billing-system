import express, {Request, Response} from 'express'

const main = async (): Promise<void> => {
    const app = express()

    try {
        const PORT = Number(process.env.PORT)
        const HOST = process.env.HOST

        if (!PORT || !HOST) {
            throw new Error("HOST and PORT must be defined in environment variables.")
        }

        app.listen(PORT, HOST, () => {
            console.log(`Server listening on http://${HOST}:${PORT}`)
        })
    } catch (err) {
        console.error("Error starting the server:", err)
        process.exit(1)
    }
}

main()
    