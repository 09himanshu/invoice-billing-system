interface notify {
    name: string
    totalAmount: string
    invoiceID: string
    storeName: string
}

export const template = async ({name, totalAmount, invoiceID, storeName}: notify) => {
    return `<!DOCTYPE html>
<html>

<body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f5f7fa;">

	<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0"
					style="background:#ffffff; border:1px solid #e1e4e8; border-radius:6px; overflow:hidden;">

					<!-- Header -->
					<tr>
						<td style="background:#2d3748; padding:20px; text-align:center; color:#ffffff;">
							<h2 style="margin:0; font-size:22px; letter-spacing:0.5px;">${storeName}</h2>
						</td>
					</tr>

					<!-- Greeting -->
					<tr>
						<td style="padding:25px 20px 10px; color:#333333; font-size:15px; line-height:22px;">
							<p style="margin:0 0 12px;">Dear <strong>${name}</strong>,</p>
							<p style="margin:0;">Thank you for your purchase with <strong>${storeName}</strong>.
								Please find your invoice details below. The complete invoice is attached to this email
								for your reference.</p>
						</td>
					</tr>

					<!-- Invoice Summary -->
					<tr>
						<td style="padding:20px;">
							<table width="100%" cellpadding="8" cellspacing="0"
								style="border:1px solid #e1e4e8; border-radius:4px; font-size:14px; color:#333;">
								<tr style="background:#f9fafb;">
									<td style="border-bottom:1px solid #e1e4e8;"><strong>Invoice ID</strong></td>
									<td style="border-bottom:1px solid #e1e4e8;">${invoiceID}</td>
								</tr>
								<tr>
									<td style="border-bottom:1px solid #e1e4e8;"><strong>Invoice Date</strong></td>
									<td style="border-bottom:1px solid #e1e4e8;">${Date.now().toLocaleString()}</td>
								</tr>
								<tr style="background:#f9fafb;">
									<td><strong>Grand Total</strong></td>
									<td>${totalAmount}</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td
							style="padding:20px; font-size:12px; color:#777; text-align:center; border-top:1px solid #e1e4e8;">
							If you have any questions about this invoice, please contact us at
							<a href="mailto:support@maxstores.com"
								style="color:#3182ce; text-decoration:none;">support@maxstores.com</a>.<br/><br/>
                Thank you for choosing <strong>${storeName}</strong>.
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>

</body>

</html>
`
}