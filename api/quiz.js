import {arrayContainsValue} from "../functions.js"
import QuizDAO from "../dao/quizDAO.js"


export default class QuizCtrl {
    static async apiAddQuestion(req, res, next,){
        try{

            const user = req.user || ""
            const question = req.body.question
            const answers = req.body.answers
            const correctAnswer = parseInt(req.body.correctAnswer)
            const category = req.body.category
            const date = new Date()
            const description = req.body.description
            

            let validQuestion = await QuizDAO.validateQuestionFormat(answers, question, correctAnswer, category)
            if (validQuestion.error) {
                return res.status(400).json({error: error})
            }

            for(let i=0;i<category.length; i++){
                category[i] = category[i].toLowerCase()
            }
        
            let response = await QuizDAO.addQuestion(user, answers, correctAnswer, category, date, question, description)

            if (response.error) {
                return res.status(400).json({error: "Couldn't add question." })
            }
            return res.status(201).json({status: "question created"})
            }
        catch (e) {
            console.log(e)
            return res.status(500).json({ error: "Something went wrong try again" })
        }
    }    
    
    static async apiDeleteQuestion(req, res, next,){
        try{
            const user = req.user
            const questionId = req.params.id || {}

            let response = await QuizDAO.deleteQuestion(user, questionId)
            let { error } = response

            if (response.deletedCount === 0 || error) {
                res.status(400).json({error: "Couldn't delete question." })
                return
            }
            res.status(201).json({status: "question deleted"})
        }
        catch (e) {
            console.log(e)
            res.status(500).json({ error: "Something went wrong try again" })
        }
    }

    static async apiUpdateQuestion(req, res, next,){
        try{
            if(req.body.answerFromUser!==undefined){
               // this part of code is for updating answer's from user
                const answerFromUser = req.body.answerFromUser
                const questionId = req.params.id
                const user = req.user

                const possibleCorrectAnswers = [0, 1, 2, 3]
                if(!arrayContainsValue(possibleCorrectAnswers, answerFromUser)) return res.status(403).json({ error: "Chose which answer is correct"})
                
                let response = await QuizDAO.updateAnswersFromUserToQuestion(questionId, user, answerFromUser)
                
                if (response.modifiedCount===0 || response.error) {
                    res.status(400).json({error: "Couldn't update question." })
                    return
                }
            
                return res.status(201).json({error: "question answered"})

            }
            if(req.user === undefined) return res.status(403).json({error: "You must be logged in to update question."})
            const user = req.user   // this part of code is for updating content of question
            const questionId = req.params.id
            const question = req.body.question
            const answers = req.body.answers
            const correctAnswer = req.body.correctAnswer
            const category = req.body.category
            const description = req.body.description
            const dropData = req.body.dropData ? req.body.dropData : false

            let validQuestion = await QuizDAO.validateQuestionFormat(answers, question, correctAnswer, category)

            if (validQuestion.error) {
                res.status(400).json({error: validQuestion.error})
                return
            }

            for(let i=0;i<category.length; i++){
                category[i] = category[i].toLowerCase()
            }

            const possibleCorrectAnswers = [0, 1, 2, 3]
            if(!arrayContainsValue(possibleCorrectAnswers, correctAnswer)) res.status(403).json({error: "Chose which answer is correct"})
            
            let response = await QuizDAO.updateQuestion(user, answers, correctAnswer, category, question, description, questionId, dropData)
  
            if (response.modifiedCount===0 || response.error) {
                res.status(400).json({error: "Couldn't update question." })
                return
            }
            res.status(201).json({status: "question updated"})
        }
        catch (e) {
            console.log(e)
            res.status(500).json({ error: "Something went wrong try again" })
        }
    }

    static async apiGetQuestion(req, res, next,){
        try{
            const questionsPerPage = req.query.questionsPerPage ?parseInt(req.query.questionsPerPage, 10): 10
            const page = req.query.page ? parseInt(req.query.page, 10): 0
            let filters = {}
            if (req.query.id){
                filters.id = req.query.id
            }
            else if ( req.query.category){
                filters.category = req.query.category
            }
            else if(req.query.user){
                filters.user = req.query.user
            }
            
            let user = req.user
            
            const { questionList, unansweredQuestions} = await QuizDAO.getQuestion({user,filters,page,questionsPerPage,})  
            
            let response ={
                questions: questionList,
                page: page,
                entries_per_page: questionsPerPage,
                unansweredQuestions: unansweredQuestions
            }
            
            res.json(response)
        }
        catch (e) {
            console.log(e)
            res.status(500).json({error: "Something went wrong try again" })
        }

    }

    

    
}