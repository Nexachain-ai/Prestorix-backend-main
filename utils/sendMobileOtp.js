// client.verify.v2.services("VA3883c89f39f1cf7351987eed0709bc19")
//     .verifications
//     .create({ to: '+919993914345', channel: 'sms' })
//     .then(verification => console.log(verification.sid));


const accountSid = process.env.TWILIO_SID
const authToken = process.env.TWILIO_TOKEN
const client = require("twilio")(accountSid, authToken);

const sendSMS = async (mobile, message) => {
    try {
        const response = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: `${mobile}`,
        });
        console.log("SMS sent:", response.sid);
        return true;
    } catch (error) {
        console.error("Error sending SMS:", error.message);
        return false;
    }
};
module.exports = { sendSMS };