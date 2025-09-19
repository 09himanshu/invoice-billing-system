import fs from 'fs'
import path from 'path'
import pdfKit from 'pdfkit'

// custom imports
import * as helper from '../helpers/calculation.helper'
import * as constant from '../utils/constant.utils'
import {db} from '../helpers/db.helper'
import { RedisService } from '../class/redis.class'
import { KafkaService } from '../class/kafka.class'
import { tableNames } from '../utils/constant.utils'
import {kafkaTopics, kafkaGroupIDs} from '../utils/constant.utils'

const redis = RedisService.getInstance()
const kafka = KafkaService.getInstance()
const filepath = path.join(__dirname, '../../bills/')


export const genBill = async (): Promise<void> => {
  const consumer = await kafka.getConsumer(kafkaGroupIDs.billing, kafkaTopics.bill)
  try {
    consumer?.subscribe({ topic: kafkaTopics.bill, fromBeginning: true })

    await consumer?.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        for (let ele of batch.messages) {
          if (/billID-/.test(ele.key!.toString())) {
            let { userId, items } = JSON.parse(ele.value!.toString())

            let user: any = await redis.get(userId)
            if (!user) {
              
              user = (await db).findOne({collection: tableNames.user, filter: {email: userId}, project: {}})
            } else {
              user = JSON.parse(user)
            }

            console.log(user, userId)
            return

            const totalPrice = await helper.calculateTotalPrice(items)
            const gstAmount = (totalPrice * 18) / 100

            if(!Object.keys(user).length) return

            let fullName = ''
            if (user.firstname) fullName += user.firstname + ' '
            if (user.middlename) fullName += user.middlename + ' '
            if (user.lastname) fullName += user.lastname
            user.fullName = fullName

            const storeinfo =
              constant.storeAddresses[Math.floor(Math.random() * constant.storeAddresses.length)]

            const doc = new pdfKit({ size: 'A4', margin: 50 })
            doc.pipe(fs.createWriteStream(`${filepath}${ele.key!.toString().split('-')[1]}.pdf`))

            // ---------------- HEADER ----------------
            doc
              .fontSize(22)
              .fillColor('#2E86C1')
              .text('MAX STORES', { align: 'center' })
              .fillColor('black')
              .fontSize(14)
              .text('TAX INVOICE / BILL OF SUPPLY', { align: 'center' })
              .moveDown(1)

            // ---------------- STORE & CUSTOMER INFO ----------------
            const topY = doc.y
            const customerX = 350

            // Store info
            doc
              .fontSize(10)
              .text('Store Address:', 50, topY, { underline: true })
              .text(storeinfo.address, 50, topY + 15)
              .text(`GSTIN: ${storeinfo.gstNumber}`, 50, topY + 30)
              .text(`Phone: ${storeinfo.phone}`, 50, topY + 45)
              .text(`Invoice ID: ${ele.key!.toString().split('-')[1]}`, 50, topY + 60)

            // Customer info
            doc
              .fontSize(10)
              .text('Bill To:', customerX, topY, { underline: true })
              .text(`Name: ${user.fullName}`, customerX, topY + 15)
              .text(`Customer ID: ${user.customerID}`, customerX, topY + 30)
              .text(`Email: ${user.email}`, customerX, topY + 45)
              .text(`Phone: ${user.mobile}`, customerX, topY + 60)

            // ---------------- TABLE HEADER FUNCTION ----------------
            const itemX = 50
            const codeX = 220
            const qtyX = 340
            const mrpX = 400

            function drawTableHeader(y: number) {
              doc
                .font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#000')
                .text('ITEM NAME', itemX, y, { width: 150 })
                .text('ITEM CODE', codeX, y, { width: 100 })
                .text('QTY', qtyX, y, { width: 40, align: 'right' })
                .text('PRICE', mrpX, y, { width: 80, align: 'right' })

              doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke()
              doc.font('Helvetica').fontSize(10).fillColor('black')
            }

            // ---------------- TABLE ROWS ----------------
            const tableTop = doc.y + 10
            drawTableHeader(tableTop)
            doc.font('Helvetica').fontSize(10)

            let i = 0
            let currentY = tableTop + 25
            const bottomMargin = 120 // reserved space for summary

            for (let item of items) {
              // Check for page break
              if (currentY > doc.page.height - bottomMargin) {
                doc.addPage()
                drawTableHeader(50)
                currentY = 75
              }

              // alternate row background
              if (i % 2 === 0) {
                doc.rect(50, currentY - 3, 450, 18).fill('#F8F9F9').fillColor('black')
              }

              doc
                .text(item.productName, itemX, currentY, { width: 150 })
                .text(item.productId, codeX, currentY, { width: 100 })
                .text(item.quantity.toString(), qtyX, currentY, { width: 40, align: 'right' })
                .text(Number(item.price).toFixed(2), mrpX, currentY, { width: 80, align: 'right' })

              currentY += 20
              i++
            }

            // ---------------- SUMMARY ----------------
            const summaryLabelX = 50
            const summaryValueX = 480

            function drawSummaryRow(
              label: string,
              value: string | number,
              y: number,
              color = 'black',
              bold = false
            ) {
              if (bold) doc.font('Helvetica-Bold')
              else doc.font('Helvetica')
              doc.fillColor(color)
              doc.text(label, summaryLabelX, y, { width: 200, align: 'left' })
              doc.text(value.toString(), summaryValueX - 80, y, { width: 80, align: 'right' })
              doc.fillColor('black')
            }

            // move to new page if summary doesn’t fit
            if (currentY > doc.page.height - bottomMargin) {
              doc.addPage()
              currentY = 100
            }

            doc.moveDown(2).fontSize(11)
            let summaryY = currentY + 30

            drawSummaryRow('Subtotal:', totalPrice.toFixed(2), summaryY)
            summaryY += 15
            drawSummaryRow('Tax (GST):', gstAmount.toFixed(2), summaryY)
            summaryY += 20
            drawSummaryRow('Grand Total:', (totalPrice + gstAmount).toFixed(2), summaryY, '#2E86C1', true)
            
            doc.end()

            const notify: object = {
              filepath: `${filepath}${ele.key!.toString().split('-')[1]}.pdf`,
              info: {
                name: user.fullName,
                sendTo: user.email,
                totalAmount: (totalPrice + gstAmount).toFixed(2),
                invoiceID: `${ele.key!.toString().split('-')[1]}`,
                storeName: 'MAX Stores'
              }
            }

            // await producer?.send({
            //   topic: kafkaTopics.notify,
            //   messages: [
            //     {
            //       key: `email-${ele.key?.toString()}`,
            //       value: JSON.stringify(notify),
            //       partition: 2
            //     }
            //   ]
            // })
          }

          resolveOffset(ele.offset)
          await heartbeat()
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
}
