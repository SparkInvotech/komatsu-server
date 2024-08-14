import express from "express"
import cors from "cors"
import { configDotenv } from "dotenv";
configDotenv()

const PORT = process.env.PORT || 5000;

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hello");
})

app.listen(PORT, () => console.info(`Server started on port ${PORT}!`))