import otplib from 'otplib'

otplib.authenticator.options = {
    step:180
}

function generateOTP(){
    return otplib.authenticator.generate(process.env.OTP_SECRET)
}

function validOTP(otp){
    return otplib.authenticator.check(otp,process.env.OTP_SECRET)
}

export {generateOTP,validOTP}