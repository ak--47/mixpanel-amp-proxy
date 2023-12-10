require("dotenv").config();
const app = require("./server");
const port = process.env.PORT || 3000;

const start = (port) => {
	try {
		app.listen(port, () => {
			console.log(`PROXY LISTENING ON ${port}`);
		});
	} catch (err) {
		console.error(err);
		process.exit();
	}
};

start(port);
