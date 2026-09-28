const db = require("./db");

console.log("DB FILE LOADED");
console.log("PASSWORD:", db.config.password ? "PRESENT" : "MISSING");

db.query("SELECT 1 AS test", (err, result) => {
    if (err) {
        console.log("DATABASE ERROR:", err.message);
    } else {
        console.log("DATABASE SUCCESS:", result);
    }

    db.end();
});