import fs from 'fs'

import nodemailer, {Transporter} from 'nodemailer'
import {env} from '../config/env.config'

interface options {
    from: string,
    to: string,
    subject: string,
    html: string,
    document: string
}


export class Mailer {
    private static instance: Mailer
    private transporter: Transporter;

    private constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.smtpHost,
            port: Number(env.smtpPort),
            secure: false,  
            auth: {
                user: env.smtpUser,
                pass: env.smtpPassword
            }
        })
    }

    public static getInstance() {
        if(!Mailer.instance) {
            Mailer.instance = new Mailer()
        }
        return Mailer.instance
    }

    public async sendMail({from, to, subject, html, document}: options) {
        try {
            let stream = fs.readFileSync(document)

            const info = await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
                attachments: [
                    {
                        filename: 'invoice.pdf',
                        content: stream,
                        contentType: 'application/pdf'
                    }
                ]
            })
            console.log(info)
            fs.unlinkSync(document)
        } catch (err) {
            console.log(err)
        }
    }
}