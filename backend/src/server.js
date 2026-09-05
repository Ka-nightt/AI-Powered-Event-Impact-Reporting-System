require("dotenv").config();
const app = require("./app");

console.log("DEBUG: typeof app =", typeof app);
console.log("DEBUG: app keys =", app && Object.keys(app));
console.log("DEBUG: has listen =", typeof app?.listen);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Event Impact Reporting API listening on port ${PORT}`);
});
