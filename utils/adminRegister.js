const AdminModel = require("../models/admin.model");
const { getHashPassword } = require("./encrypt");

const adminRegister = async () => {
    try {
        const admin = await AdminModel.findOne({
            email: process.env.ADMIN_EMAIL,
        });
        if (admin) return console.log("Admin already registered.");
        const newAdmin = await AdminModel.create({
            name: process.env.ADMIN_USERNAME,
            mobile: process.env.ADMIN_MOBILE,
            email: process.env.ADMIN_EMAIL,
            password: await getHashPassword(process.env.ADMIN_PASSWORD),
        });
        if (!newAdmin) return console.log("Register field.");
        console.log("Admin register successfully.!");
    } catch (error) {
        console.log(error);
    }
};
module.exports = { adminRegister };
