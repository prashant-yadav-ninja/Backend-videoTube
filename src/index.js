import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is listening at port : ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed");
    process.exit(1);
  });

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(e)=>{
//             console.log("Error comes:",e)
//             throw e
//         })

//         app.listen(PORT,()=>{
//             console.log('server is listening at port :',PORT)
//         })
//     } catch (error) {
//         console.error("Error comes : ",error)
//         console.log("break")
//         throw error
//     }
// })();
