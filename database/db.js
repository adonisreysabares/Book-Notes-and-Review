import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const {Pool} = pg


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT // Make sure you have DB_PORT defined in your environment variables
});


pool.connect()
.then(()=>{
    console.log("Databasae is Connected")
})
.catch((err)=>{
    console.error("An error occured ", err.stack)
})

export default pool