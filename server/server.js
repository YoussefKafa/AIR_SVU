import express from 'express';
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import questionRoutes from './routes/questionRoutes.js'
import morgan from 'morgan'
import cors from 'cors'


dotenv.config({ path: '../.env' })



connectDB(process.env.MONGO_URI)

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}


app.use(express.json());
app.use(cors())

app.use('/api/questions',questionRoutes)




const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.cyan.underline);
})