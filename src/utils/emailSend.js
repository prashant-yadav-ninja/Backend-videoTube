// this is for verification to change - password or forget password

import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const sendEmail = async (receiverEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: receiverEmail,
    subject: "Verification",
    text: `Your OTP code is ${otp}. It is valid for 2 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(info,'come from sending email');


  } catch (error) {
    console.log(error)
    throw new ApiError(500,'Error in Sending OTP email')
  }
};

export { sendEmail };
