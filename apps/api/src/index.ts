import dotenv from "dotenv";

dotenv.config();

import "./jobs/finaliseJob";
import "./jobs/syncOnChainJob";
import app from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});
