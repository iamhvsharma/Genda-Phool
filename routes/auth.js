const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
let tempOTP = ''; // Temporary storage for OTP (in production, use Redis or DB)

// Send OTP to WhatsApp using template
router.post('/send-otp', async (req, res) => {
  const { whatsappNumber } = req.body;

  if (!whatsappNumber) {
    return res.status(400).json({ error: 'WhatsApp number is required' });
  }

  // Ensure number is in international format (e.g., 919119204808)
  const formattedNumber = whatsappNumber.startsWith('+') 
    ? whatsappNumber.replace('+', '') 
    : `91${whatsappNumber}`; // Assuming Indian numbers if no country code

  tempOTP = generateOTP();
  console.log(`Generated OTP: ${tempOTP} for ${formattedNumber}`); // Log OTP

  const messageData = {
    messaging_product: "whatsapp",
    to: formattedNumber,
    type: "template",
    template: {
      name: "otpverification",
      language: {
        code: "en_US"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: tempOTP // For {{1}} in the body
            }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: 0, // Index of the button (0 if it’s the first button)
          parameters: [
            {
              type: "text",
              text: tempOTP // For {{1}} in the URL button (adjust based on your needs)
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.FACEBOOK_PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          Authorization: `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('WhatsApp API Response:', response.data); // Log success response
    res.status(200).json({ message: 'OTP sent to WhatsApp' });
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message); // Log detailed error
    res.status(500).json({ error: 'Failed to send OTP', details: error.response?.data });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { whatsappNumber, otp } = req.body;

  if (!whatsappNumber || !otp) {
    return res.status(400).json({ error: 'WhatsApp number and OTP are required' });
  }

  if (otp !== tempOTP) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    // Normalize the number format for lookup
    const formattedNumber = whatsappNumber.startsWith('+') 
      ? whatsappNumber.replace('+', '') 
      : `91${whatsappNumber}`;

    let user = await User.findOne({ whatsappNumber: formattedNumber });
    if (!user) {
      user = new User({ whatsappNumber: formattedNumber, isVerified: true });
      await user.save();
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    tempOTP = ''; // Clear OTP after verification
    res.status(200).json({ message: 'Number verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;