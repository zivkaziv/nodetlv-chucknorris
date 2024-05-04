const accounts = require("./accounts.json");
const auth = (req, res, next) => {
	try {
        const token = req.headers.authorization;
        if(!accounts[token]){
            throw "Invalid user ID";
        }
        req.account = accounts[token];
        next();
	} catch {
		res.status(401).json({
			error: new Error("Invalid request!"),
		});
	}
};
module.exports = { auth };
