const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Initialize LINE SDK client
const client = new Client(config);

// Webhook handling
app.post('/webhook', middleware(config), (req, res) => {
  // Reply a simple message to confirm the connection
  Promise.all(req.body.events.map((event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'การเชื่อมต่อสำเร็จ! ขอบคุณที่ส่งข้อความมาหาเรา',
      });
    }
    return Promise.resolve(null); // No response for other event types
  }))
  .then(() => res.status(200).send('OK'))
  .catch((err) => {
    console.error('Error handling webhook event:', err);
    res.status(500).send('Internal Server Error');
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
