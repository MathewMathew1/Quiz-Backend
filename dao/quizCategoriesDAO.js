

let groupCategories
import {categories} from "../server.js"

import ImagesDao from './imagesDAO.js'
import QuizDAO from './quizDAO.js'

export default class QuizCategoriesDAO {
    static async injectDB(conn) {
        if(groupCategories) {
            return
        }
        try{
            groupCategories = await conn.db(process.env.RESTQUIZ_NS).collection("categories_group")
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in quizCategoriesDAO`
            )
        } 
    }

    static async getAllCategoriesInGroups(){
        try{
            let categoriesGroups = await groupCategories.find({}).project({  categories: 1, name:1,  _id: 0 }).toArray()
            return categoriesGroups
        }
        catch(e){
            return {error: e}
        }
    }

    static async getAllCategories() {
        try{
            let categories = await groupCategories.find({}).project({  categories: 1, _id: 0 }).toArray()
            
            let listOfAllCategories = [] 
            for(let i=0; i<categories.length; i++){
                for(let j=0; j<categories[i].categories.length; j++){
                    listOfAllCategories.push(categories[i].categories[j])
                }
            }    
            return listOfAllCategories
        }
        catch(e){
            console.log(e)
            return {error: e}
        }
    }

    static async getAllGroups() {
        try{
            let groups = await groupCategories.find()
            groups = await groups.toArray()
            let groupsWithImage = ImagesDao.getImagesForCategoriesGroups(groups)
            if(!groupsWithImage.error){
                groups = groupsWithImage
            }
            return groupsWithImage
        }catch(e){
            console.log(e)
            return {error: e}
        }
    }


    static async changeInGroups(changes) {
        try{
            let modifiedCount = 0
            for(let i=0; i<changes.length; i++){
                const removingCategoryFromOldGroup = await groupCategories.updateOne(
                    { name : changes[i].nameOfFormerGroup},
                    { $pull: {categories: changes[i].nameOfCategory}} 
                            
                )

                const addingCategoryFromOldGroup = await groupCategories.updateOne(
                    { name : changes[i].nameOfNewGroup},
                    { $push: {categories: changes[i].nameOfCategory}} 
                            
                )
                modifiedCount =+ removingCategoryFromOldGroup.modifiedCount
                modifiedCount =+ addingCategoryFromOldGroup.modifiedCount
            }
            let response 

            if(changes.length*2===modifiedCount){
                response = "Everything updated correctly"
            }
            else if(modifiedCount!==0){
                response = `Updated ${modifiedCount} out of ${changes.length*2}, possibly someone removed category from group before`
            }
            else{
                response = `Failed to update`
            }
            return response
        }catch(e){
            console.log(e)
            return {error: e}
        }
    }

    static async createNewCategory(name) {
        try{
            const updateResponse = await groupCategories.updateOne(
                { name : "Other"},
                {
                    $push: {
                        categories: {
                         $each: [name ],
                      }
                    }
                }        
            )
            return updateResponse
        } catch(e){
            console.log(e)
            return {error: e}
        }
    }


    static async getUserQuizData(User) {
        let userStatistics = []
        try {
            for(let i=0; i<categories.length; i++){
                let dataFromCategory = await QuizDAO.getOneCategoryUserQuizData(User, categories[i])
                userStatistics.push(dataFromCategory)
            }
            return userStatistics
        }
        catch(e){
            console.log(e)
            return { error: e }
        }
    }


    static async getCategoryGroupToWhichCategoryBelongs(category) {
        try {
            let group = await groupCategories.findOne(
                { categories: category },
                {_id: 1}
            )
            console.log(group)
            return group
        }
        catch(e){
            console.log(e)
            return { error: e }
        }

    }

}