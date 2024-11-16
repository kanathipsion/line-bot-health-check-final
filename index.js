const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Google Apps Script URL
const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

// Initialize LINE SDK client
const client = new Client(config);

let userInputs = {}; // เก็บข้อมูลผู้ใช้ชั่วคราว

// Webhook handling
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error('Error handling webhook event:', err);
      res.status(500).send('Internal Server Error');
    });
});

async function handleEvent(event) {
  const userId = event.source.userId;

  // ตรวจสอบว่าเป็นข้อความจากผู้ใช้หรือไม่
  if (event.type === 'message' && event.message.type === 'text') {
    const userInput = event.message.text.trim();

    // เริ่มต้นการกรอกข้อมูลจากผู้ใช้
    if (userInput === 'เริ่มต้นกรอกข้อมูล') {
      userInputs[userId] = { step: 1 };
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกค่าน้ำตาล',
      });
    }

    // ตรวจสอบขั้นตอนการกรอกข้อมูล
    if (userInputs[userId]) {
      if (userInputs[userId].step === 1) {
        userInputs[userId].sugarLevel = userInput;
        userInputs[userId].step = 2;
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกค่าความดัน',
        });
      } else if (userInputs[userId].step === 2) {
        userInputs[userId].bloodPressure = userInput;
        userInputs[userId].step = 3;
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกค่าน้ำหนัก',
        });
      } else if (userInputs[userId].step === 3) {
        userInputs[userId].weight = userInput;
        userInputs[userId].step = 4;
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกส่วนสูง',
        });
      } else if (userInputs[userId].step === 4) {
        userInputs[userId].height = userInput;

        // สร้าง Flex Message เพื่อแสดงข้อมูลทั้งหมด
        const flexMessage = {
          type: 'flex',
          altText: 'ข้อมูลที่คุณกรอก',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: 'ข้อมูลที่คุณกรอก', weight: 'bold', size: 'lg' },
                { type: 'text', text: `ค่าน้ำตาล: ${userInputs[userId].sugarLevel}` },
                { type: 'text', text: `ค่าความดัน: ${userInputs[userId].bloodPressure}` },
                { type: 'text', text: `น้ำหนัก: ${userInputs[userId].weight}` },
                { type: 'text', text: `ส่วนสูง: ${userInputs[userId].height}` },
              ],
            },
          },
        };

        // ส่ง Flex Message และข้อความแจ้งเตือนการประมวลผล
        try {
          await client.replyMessage(event.replyToken, [
            flexMessage,
            { type: 'text', text: 'กำลังประมวลผล รอสักครู่...' },
          ]);

          // บันทึกข้อมูลลงใน Google Sheets
          await axios.post(googleScriptUrl, {
            userId: userId,
            sugarLevel: userInputs[userId].sugarLevel,
            bloodPressure: userInputs[userId].bloodPressure,
            weight: userInputs[userId].weight,
            height: userInputs[userId].height,
            timestamp: new Date().toLocaleString(),
          });

          // ส่งสติ๊กเกอร์ตอบกลับเมื่อบันทึกข้อมูลเสร็จ
          await client.pushMessage(userId, {
            type: 'sticker',
            packageId: '1',
            stickerId: '1',
          });

          // ล้างข้อมูลผู้ใช้หลังจากประมวลผลเสร็จ
          delete userInputs[userId];
        } catch (error) {
          console.error('Error processing user input or sending data:', error);
        }
      }
    }
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
