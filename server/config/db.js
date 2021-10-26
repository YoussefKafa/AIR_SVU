import mongoose from 'mongoose';
import colors from 'colors'



const connectDB = async (URI) => {

    try {
        const connection = await mongoose.connect(URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
        console.log(`MongoDB connected: ${connection.connection.host}`.bgGreen.black.bold);
    } catch (error) {
        console.error(`error:${error.message}`.red.underline.bold)
        process.exit(1)
    }
}

export default connectDB