exports.Message = {
    success: (res, message, data) => {
        return res.status(200).json({ success: true, message, data });
    },
    error: (res, message) => {
        return res.status(500).json({ success: false, message });
    },
    notFound: (res, message) => {
        return res.status(404).json({ success: false, message });
    },
    badRequest: (res, message) => {
        return res.status(400).json({ success: false, message });
    },
    unauthorized: (res, message) => {
        return res.status(401).json({ success: false, message });
    },
    forbidden: (res, message) => {
        return res.status(403).json({ success: false, message });
    },
    created: (res, message, data) => {
        return res.status(201).json({ success: true, message, data });
    }
}

exports.ShowMessage = {
    login:"Login successfully.",
    loginError:"Invalid email or password.",
    registerMessage:"Vendor created successfully. Please Verify your account.",
    allFieldsRequired:"All fields are required",
    emailExists:"Vendor Email already exists.",
    mobileExists:"Vendor Mobile already exists.",
    referralNotExists:"Referral link does not exist",
    accountVerify:"Please Verify your account.",
    accountVerifyOtp:"Please Verify your account.",
    accountVerifyOtpSubject: "Z-Coin Account Verification OTP ✔",
    accountVerifyOtpMessage:"Please Verify your account.",
    accountVerifyOtpMessageSubject: "Z-Coin Account Verification OTP ✔",
    accountVerifyOtpMessageError:"Invalid OTP.",
    accountVerifyOtpMessageSuccess:"Account verified successfully.",
    accountVerifyOtpMessageSuccessSubject: "Z-Coin Account Verification Success ✔",
    accountVerifyOtpMessageResend:"OTP resend successfully.",
    accountVerifyOtpMessageResendSubject: "Z-Coin Account Verification OTP Resend ✔",
    accountVerifyOtpMessageResendError:"OTP already verified.",
    accountVerifyOtpMessageResendErrorSubject: "Z-Coin Account Verification OTP Already Verified ✔",
    accountVerifyOtpMessageResendErrorTime:"OTP expired.",
    accountVerifyOtpMessageResendErrorTimeSubject: "Z-Coin Account Verification OTP Expired ✔",
}
exports.EmailSendMessage = {
    subjectVerify: "Z-Coin Account Verification OTP ✔",
    subjectForgot: "Z-Coin Password Forgot OTP.",
    subjectResend: "Z-Coin Resend OTP Verification Code.",
    message:"Please Verify your account."
}
