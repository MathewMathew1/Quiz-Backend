

import QuizCategoriesDAO from "../dao/quizCategoriesDAO.js"
import QuizDAO from "../dao/quizDAO.js";
import AuthenticationDAO from "../dao/authenticationDAO.js";
import ImagesDao from "../dao/imagesDAO.js";
import { redisClient } from "../server.js"

export default class QuizCategoriesCtrl {
    static async apiGetAllGroups(req, res, next){
        try{
            let updatedData = req.query.updatedData
            if(updatedData){
                let groups = await QuizCategoriesDAO.getAllCategoriesInGroups()
          
                if(groups.error){
                    return res.status(400).json({error: "Unexpected error, try again." })
                }

                return res.json(groups)
            }

            redisClient.get("groups", function(err, reply) {
    
                if (err) {
                    return res.status(400).json({error: "Unexpected error, try again." })
                }
                    return res.status(201).json(JSON.parse(reply))
            });
            
            
            }
        catch (e) {
            console.log(e)
            return res.status(500).json({ error: "Something went wrong try again"  })
        }
    }

    static async apiGetAllCategories(req, res, next){
        try{
            let categories
            req.query
            categories = redisClient.get("categories", function(err, reply) {
    
                if (err) {
                    return res.status(400).json({error: "Unexpected error, try again." })
                }
                    return res.status(201).json(JSON.parse(reply))
            });
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({ error: "Something went wrong try again" })
        }
    }                                                               


    static async apiChangeInGroups(req, res, next){
        try{
            let changes = req.body.changes

            let response = await QuizCategoriesDAO.changeInGroups(changes)

            if (response.error) {
                res.status(400).json({error: "Something went wrong" })
                return
            }
            
            res.status(201).json(response)
        }
        catch(e){
            console.log(e)
            return res.status(500).json({ error: "Something went wrong try again" })
        }
    }

    static async apiGetUserQuizData(req, res, next){
        try{
            let User = req.user
            let category = req.query.category
            let response
            if(category === undefined){
                let userQuizData = await QuizCategoriesDAO.getUserQuizData(User)
                response ={
                    userQuizData: userQuizData,
                }
            }
            else{
                let authors = await QuizDAO.getAllAuthorsFromCategory(category)
                let QuizDataForUser = await QuizDAO.getOneCategoryUserQuizData(User, category)
                let accuracyOfUsers = await QuizDAO.getOneCategoryUsersAccuracy(category)
                QuizDataForUser["accuracyOfUsers"] = accuracyOfUsers

                let groupOfCategory = await QuizCategoriesDAO.getCategoryGroupToWhichCategoryBelongs(category)
                let image = await ImagesDao.getImageForOneCategory(groupOfCategory)
                

                response ={
                    authors: authors,
                    QuizDataForUser: QuizDataForUser,
                    image: image,
                }
            }

            if (response.error) {
                res.status(400).json({error: "Something went wrong" })
                return
            }
            res.status(201).json(response)
        }
        catch(e){
            console.log(e)
            return res.status(500).json({ error: "Something went wrong try again" })
        }
    }
}