require('dotenv').config();
const app = require('./app');
const start = async (port) => {
    try {
        await app.init();
        app.listen(port, () => {
            console.log(`Api running on port ${port}`);
        });
    } catch (err) {
        console.error(err);
        process.exit();
    }
}

(async () => {
    await start(process.env.PORT || 8000);
})()
