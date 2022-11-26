import router from './api/route.js'
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import AuthenticationDAO from "./dao/authenticationDAO.js"
import QuizDAO from "./dao/quizDAO.js"
import ImageDAO from "./dao/imagesDAO.js"
import QuizCategoriesDAO from "./dao/quizCategoriesDAO.js"
import mongodb from "mongodb"
import bodyParser from 'body-parser'
import redis from "redis"

console.log("Hello")

const VARIABLES = {
    MIN_AMOUNT_REQUIRED_FOR_NEW_CATEGORY : 2
}

let env = process.env.NODE_ENV || 'development';

export var categories = []

const app = express()
app.use(cors())
app.use(bodyParser.json());



export const redisClient = env==='development'? redis.createClient(): redis.createClient({url: process.env.REDIS_URL});

redisClient.on("error", function(error) {
  console.error(error);
});

redisClient.set("key", "value", redis.print);
redisClient.get("key", redis.print);

dotenv.config()

app.use("/api/v1/", router)
app.use("*", (req, res) => res.status(404).json({error: "Not found"}))

const MongoClient = mongodb.MongoClient
const port = process.env.PORT || 8000  

await MongoClient.connect(
    process.env.RESTQUIZ_DB_URI,
    
    {
        maxPoolSize: 50,
        useNewUrlParser: true 
    }
    ).catch(err =>{
        console.error(err.stack)
        process.exit(1)
    })
    .then(async client =>{
        await AuthenticationDAO.injectDB(client)
        await QuizDAO.injectDB(client)
        await ImageDAO.injectDB(client)
        await QuizCategoriesDAO.injectDB(client)
        app.listen(port, () => {
            console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
        })
    })

 
const createNewCategories = async () =>{
    let currentCategories = await QuizCategoriesDAO.getAllCategories()
    let categoriesStatistics = await QuizDAO.getAllCategoriesStatistics()
    
    for(let i=0; i<categoriesStatistics.length; i++){

        if(categoriesStatistics[i].amount < VARIABLES.MIN_AMOUNT_REQUIRED_FOR_NEW_CATEGORY) continue
        
        let doesThisCategoryExist = currentCategories.find(element => element === categoriesStatistics[i].name)

        if(doesThisCategoryExist !== undefined) continue
        QuizCategoriesDAO.createNewCategory(categoriesStatistics[i].name) 
        currentCategories.push(categoriesStatistics[i].name)
    }
    
    redisClient.set("categories", JSON.stringify(currentCategories));
    categories = currentCategories
    await updateDataSendToUser()
    
    setTimeout(createNewCategories, 60*1000*60);
}
    
const updateDataSendToUser = async () => {
  
  let groups = await QuizCategoriesDAO.getAllGroups()
  
  redisClient.set("groups", JSON.stringify(groups))
  
  return
} 
    
createNewCategories();   



export default app
