import express from "express"
import cors from "cors"
import { configDotenv } from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
configDotenv()

const PORT = process.env.PORT || 3000;

const app = express()

app.use(cors())
app.use(express.json())

// Initialize firebase admin app
initializeApp({
  credential: cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.RSA.replace(/\\n/g, '\n')
  }),
});

// Get firestore DB
const db = getFirestore();


/** Utility function to return timestamp in IST with `YYYY:MM:DD HH:MM:SS` format */
function getTimestampString() {
  const date = new Date();

  // IST offset is +5:30 from UTC
  const ISTOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const offsetDate = new Date(date.getTime() + ISTOffset);

  // Extract the year, month, day, hours, minutes, and seconds in IST
  const year = offsetDate.getUTCFullYear();
  const month = String(offsetDate.getUTCMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
  const day = String(offsetDate.getUTCDate()).padStart(2, "0"); // Add leading zero for single-digit days
  const hours = String(offsetDate.getUTCHours()).padStart(2, "0");
  const minutes = String(offsetDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(offsetDate.getUTCSeconds()).padStart(2, "0");

  return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

async function sendRawLogToFirestore(log) {
    const ts = getTimestampString();
    try {
        await db.collection("komatsu_logs").doc(ts).set({
            machine: 1,
            status: log
        }, { merge: true });
        console.log(`Saved data ${ts} to firestore @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
    } catch (error) {
        console.error(`Save ${ts} to firestore failed @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
        console.dir(error, { depth: 6 })
    }
}

async function sendManualLogToFirestore(log) {
    const ts = getTimestampString();
    try {
        await db.collection("komatsu_manual").doc(ts).set({
            status: log
        }, { merge: true });
        console.log(`Saved manual log ${ts} to firestore @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
    } catch (error) {
        console.error(`Save manual log ${ts} to firestore failed @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
        console.dir(error, { depth: 6 })
    }
}

app.get("/", async (req, res) => {
    try {
        const data = (await db.collection("komatsu_logs").orderBy("machine").limitToLast(15).get()).docs.map(doc => ({ ...doc.data(), time: doc.id.split(" ")[0].replaceAll(":", "-") + " " + doc.id.split(" ")[1] }))
        res.json(data);
        console.log(`Sent data to client @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
    } catch (error) {
        console.log("🚀 ~ app.get ~ error:", error)
        res.status(500).json({ error: "Server error in fetching data" });
    }
});

app.post("/", async (req, res) => {
    try {
        const data = req.body;
        sendRawLogToFirestore(data.status);
        res.json({ message: `Stored data in firestore @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` })
    } catch (error) {
        console.log("🚀 ~ app.post ~ error:", error)
        res.status(500).json({ error: "Server error in saving data" });
    }
})


app.get("/manual", async (req, res) => {
    try {
        const data = (await db.collection("komatsu_manual").get()).docs.map(doc => ({ ...doc.data(), time: doc.id }))
        res.json(data);
        console.log(`Sent manual data to client @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`)
    } catch (error) {
        console.log("🚀 ~ app.get ~ error:", error)
        res.status(500).json({ error: "Server error in fetching data" });
    }
});

app.post("/manual", async (req, res) => {
    try {
        const data = req.body;
        sendManualLogToFirestore(data.status);
        res.json({ message: `Stored data in firestore @${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` })
    } catch (error) {
        console.log("🚀 ~ app.post ~ error:", error)
        res.status(500).json({ error: "Server error in saving data" });
    }
})

app.listen(PORT, () => console.info(`Server started on port ${PORT}!`))

export default app;