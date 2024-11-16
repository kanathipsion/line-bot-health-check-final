const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
app.use(express.json());

// Load environment variables (ใช้เฉพาะในเครื่องท้องถิ่นเท่านั้น)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// เพิ่ม route สำหรับการตอบสนอง GET ที่ root URL
app.get('/', (req, res) => {
  res.send('Hello! This is the LINE Bot server for basic connection testing.');
});

// รับ POST request จาก LINE Webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  const events = req.body.events;
  if (events.length > 0) {
    const event = events[0]; // รับ Event แรกเพื่อทดสอบ
    if (event.type === 'message' && event.message.type === 'text') {
      // ตอบกลับข้อความง่าย ๆ เพื่อทดสอบการเชื่อมต่อ
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'การเชื่อมต่อสำเร็จ! ขอบคุณที่ส่งข้อความมาหาเรา',
      })
      .then(() => {
        res.status(200).send('OK');
      })
      .catch((err) => {
        console.error('Error replying message:', err);
        res.status(500).send('Internal Server Error');
      });
    }
  }
  res.status(200).send('No events to process');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
