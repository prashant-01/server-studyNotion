const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config();
const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL)
	.then(() => console.log("DB Connected"))
	.catch((err) => {
		console.log(`Error in connecting DB`);
		console.error(err.message);
		process.exit(1);
	});
} 

module.exports = dbConnect;