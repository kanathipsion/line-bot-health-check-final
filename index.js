const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// Load environment variables
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

let userInputs = {}; // ใช้เก็บข้อมูลผู้ใช้ชั่วคราว

app.post('/webhook', line.middleware(config), (req, res) => {
  const events = req.body.events;
  events.forEach((event) => {
    handleEvent(event);
  });
  res.status(200).send('OK');
});

function handleEvent(event) {
  const userId = event.source.userId;

  if (event.type === 'message' && event.message.type === 'text') {
    const userInput = event.message.text;

    if (!userInputs[userId]) {
      userInputs[userId] = { step: 1 };
      client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกค่าน้ำตาล',
      });
    } else {
      if (userInputs[userId].step === 1) {
        userInputs[userId].sugarLevel = userInput;
        userInputs[userId].step = 2;
        client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกค่าความดัน',
        });
      } else if (userInputs[userId].step === 2) {
        userInputs[userId].bloodPressure = userInput;
        userInputs[userId].step = 3;
        client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกค่าน้ำหนัก',
        });
      } else if (userInputs[userId].step === 3) {
        userInputs[userId].weight = userInput;
        userInputs[userId].step = 4;
        client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกส่วนสูง',
        });
      } else if (userInputs[userId].step === 4) {
        userInputs[userId].height = userInput;
        userInputs[userId].step = 5;

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

        client.replyMessage(event.replyToken, [
          flexMessage,
          { type: 'text', text: 'กำลังประมวลผล รอสักครู่...' },
        ]);

        axios.post(process.env.GOOGLE_SCRIPT_URL, userInputs[userId])
          .then(() => {
            client.pushMessage(userId, {
              type: 'sticker',
              packageId: '1',
              stickerId: '1',
            });
          })
          .catch((err) => {
            console.error('Error sending data to Google Sheets:', err);
          });

        delete userInputs[userId];
      }
    }
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});