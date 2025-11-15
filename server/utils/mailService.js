
import nodemailer from 'nodemailer'
import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_MAIL_OAUTH_CLIENT_ID,
    process.env.GOOGLE_MAIL_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_MAIL_REDIRECT_URI,
);


export function setEmailServiceCredentials() {
    try {
        oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_MAIL_REFRESH_TOKEN });
        console.log("Email service set");
    } catch (error) {
        console.log('failed to set email service');
    }
}

export async function sendEmail(from, to, subject, text, html) {

    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.GOOGLE_MAIL_OAUTH_CLIENT_ID,
                clientSecret: process.env.GOOGLE_MAIL_OAUTH_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN,
            },
        });

        const mailOptions = {
            from,
            to,
            subject,
            text,
            html,
        };

        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

