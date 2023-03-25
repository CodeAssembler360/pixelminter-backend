const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongoURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log(error.message);
    //Exit Process with Failure
    process.exit(1);
  }
  //Mongoose Deprication Warning
  // mongoose.set("useFindAndModify", false);
};

module.exports = connectDB;
