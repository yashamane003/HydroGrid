const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const CompanySchema = new mongoose.Schema({
  name: String,
  users: [mongoose.Schema.Types.ObjectId],
  devices: [mongoose.Schema.Types.ObjectId],
});
const Company =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);

const UserSchema = new mongoose.Schema({
  name: String,
  company: mongoose.Schema.Types.ObjectId,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const DeviceSchema = new mongoose.Schema({
  deviceId: String,
  company: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
});
const Device = mongoose.models.Device || mongoose.model("Device", DeviceSchema);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    let company = await Company.findOne({ name: "General Farm" });
    if (!company) {
      company = await Company.create({ name: "General Farm" });
    }

    const users = await User.find({ company: null });
    for (let u of users) {
      u.company = company._id;
      await u.save();
      if (!company.users.includes(u._id)) company.users.push(u._id);
    }

    const devices = await Device.find({ company: null });
    for (let d of devices) {
      d.company = company._id;
      await d.save();
      if (!company.devices.includes(d._id)) company.devices.push(d._id);
    }

    await company.save();
    console.log(`Fixed ${users.length} users and ${devices.length} devices.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
