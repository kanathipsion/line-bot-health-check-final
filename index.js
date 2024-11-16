function handleEvent(event) {
  const userId = event.source.userId;

  if (event.type === 'message' && event.message.type === 'text') {
    const userInput = event.message.text.toLowerCase(); // แปลงข้อความเป็นตัวพิมพ์เล็กเพื่อเปรียบเทียบง่ายขึ้น

    // ตรวจสอบว่าเป็นข้อความเริ่มต้นที่กำหนดไว้
    if (userInput === 'คำนวณผลสุขภาพ' || userInput === 'ผลสุขภาพ') {
      // เริ่มต้นกระบวนการกรอกข้อมูล
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
        userInputs[userId].step = 5;

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

        client.replyMessage(event.replyToken, [
          flexMessage,
          { type: 'text', text: 'กำลังประมวลผล รอสักครู่...' },
        ]);

        // ส่งข้อมูลไปบันทึกใน Google Sheets
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

        // ล้างข้อมูลผู้ใช้หลังจากประมวลผลเสร็จ
        delete userInputs[userId];
      }
    }
  }
}
