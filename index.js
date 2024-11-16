const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Google Apps Script URL
const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

// Initialize LINE SDK client
const client = new Client(config);

// Webhook handling
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error('Error handling webhook event:', err);
      res.status(500).end();
    });
});

// Function to handle LINE messages
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // Extract values from message (example: "ค่าน้ำตาล 90 ค่าความดัน 110")
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      let replyMessage = "";
      let healthStatus = "";

      // Check each condition and assign a specific message
      if (sugarLevel <= 100 && pressureLevel <= 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
        healthStatus = 'ปกติ';
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
        healthStatus = 'น้ำตาลสูง';
      } else if (sugarLevel < 70 && pressureLevel <= 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
        healthStatus = 'น้ำตาลต่ำ';
      } else if (sugarLevel <= 100 && pressureLevel > 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ';
        healthStatus = 'ความดันสูง';
      } else if (sugarLevel <= 100 && pressureLevel < 60) {
        replyMessage = 'ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้ว';
        healthStatus = 'ความดันต่ำ';
      } else if (sugarLevel > 100 && pressureLevel > 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ';
        healthStatus = 'น้ำตาลและความดันสูง';
      } else if (sugarLevel > 100 && pressureLevel < 60) {
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นควรไปหาหมอนะ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นแขบไปหาหมอได้แล้ว';
        healthStatus = 'น้ำตาลสูงและความดันต่ำ';
      } else if (sugarLevel < 70 && pressureLevel > 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ';
        healthStatus = 'น้ำตาลต่ำและความดันสูง';
      }

      // Send data to Google Sheets (commented out for testing)
      /*
      axios.post(googleScriptUrl, {
        userId: event.source.userId,
        sugarLevel: sugarLevel,
        pressureLevel: pressureLevel,
        healthStatus: healthStatus,
        advice: replyMessage,
        timestamp: new Date().toLocaleString(),
      }).then(() => {
        console.log('Data sent to Google Sheets');
      }).catch(error => {
        console.error('Error sending data to Google Sheets:', error);
      });
      */

      // Reply to user with the specific message
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyMessage,
      });
    } else {
      // Message format error
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")',
      });
    }
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
