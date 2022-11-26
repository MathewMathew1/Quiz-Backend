
import { arrayContainsValue } from "../functions.js"
import mongodb from "mongodb"

const ObjectId = mongodb.ObjectId
let quiz

export default class QuizDAO {
    static async injectDB(conn) {
        if(quiz) {
            return
        }
        try{
            quiz = await conn.db(process.env.RESTQUIZ_NS).collection("questions")
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in quizDAO`
            )
        } 
    }

    static async addQuestion(user, answers, correctAnswer, category, date, question, description) {
        try{
            const newQuestion = { 
                user: user ?ObjectId(user._id) : "",
                answers: answers,
                correctAnswer: correctAnswer,
                category: category,
                question: question,
                date: date,
                description: description,
                accepted: true,
                answersFromUsers: [],
            }
            return await quiz.insertOne(newQuestion)
        } catch(e){
            return {error: e}
        }
    }

    static async deleteQuestion(user, questionId) {
        try {
            const deleteResponse = await quiz.deleteOne({
                _id: ObjectId(questionId),
                user: ObjectId(user._id),
            })
            return deleteResponse
        } catch (e) {
            return { error: e }
        }
    }

    static async updateQuestion(user, answers, correctAnswer, category, question, description, questionId, dropData) {
        try {    
            const updateResponse = await quiz.updateOne(
                { user: ObjectId(user._id), _id: ObjectId(questionId)},
                [{ $set: { 
                    answers: answers, 
                    correctAnswer: correctAnswer,
                    question: question,
                    description: description,
                    category: category,
                    answersFromUsers: {
                        $cond: {
                            if: dropData,
                            then: [], 
                            else: '$answersFromUsers', 
                        }
                    }  
                } }],        
            )
            return updateResponse
        } catch (e) {
            return { error: e }
        }
    }

    static async updateAnswersFromUserToQuestion(questionId, user, answerFromUser){
        try {
            const userId = user? user._id : ""
            const addNewAnswerFromUser = await quiz.updateOne( {_id: ObjectId(questionId), "answersFromUsers.user" : ObjectId(userId) } , 
                {$set : {"answersFromUsers.$.answerFromUser" : answerFromUser} } , 
               );
            
            if(addNewAnswerFromUser.modifiedCount>0){
                return addNewAnswerFromUser
            }

            const editNewAnswerFromUser = await quiz.updateOne(
                {_id: ObjectId(questionId), "answersFromUsers.user" : {$ne : ObjectId(userId) }} , 
                {$addToSet : {"answersFromUsers" : {'user' : user? ObjectId(userId): "" , 'answerFromUser' : answerFromUser }} }
            )

            return editNewAnswerFromUser
        }
        catch (e) {
            console.log(e)
            return { error: e }
        }
    }

    static async getQuestion({filters = null, page = 0, questionsPerPage = 10, user = 0} = {}){
        try {
            
            let query
            let skip
            let limit = { $limit: questionsPerPage}

            if(filters){
                if("id" in filters){
                    query = {"_id": {$eq: ObjectId(filters["id"])}}
                    skip = none                    
                } else if ("category" in filters){
                    query = {"category": { $elemMatch: { $eq: filters["category"]  } }, 'answersFromUsers.user': {$not: {$eq: ObjectId(user._id)}}  }
                    skip = { $sample: { size: questionsPerPage } }                    
                } else if ("user" in filters){
                    query = {"user" : {$eq: ObjectId(filters["user"]) }}
                    skip = { $skip: questionsPerPage * page }                    
                }
            } // if there is search by category we want to return questions that haven't been answered yet and if none found return just questions from
            // that category
            
            const totalNumQuestions =  await quiz.countDocuments(query)

            if(totalNumQuestions===0){
                if ("category" in filters){
                    query = {"category": { $elemMatch: { $eq: filters["category"]  } }}
                }
                else{
                    return { questionList: [], unansweredQuestions: 0 }
                }
            }
            
            let questionList
            const pipeline = [
                { $match: query },
                skip,
                limit,
                {$lookup: {
                        from: "users",
                        let: {
                            user: "$user",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$user"],
                                    },
                                },
                            },
                            {
                                $project: {
                                    username:1, _id:0
                                },
                            },
                        ],
                        as: "author",
                    },    
                },
                {$project: {"user" : 0, "answersFromUsers.user" : 0},}
            ]
            
            const unansweredQuestions = Math.max(totalNumQuestions-questionsPerPage, 0)
            questionList = await quiz.aggregate(pipeline).toArray()
            
         
            return { questionList, unansweredQuestions}
        } catch (e) {
            console.log(e)
            return { questionList: [], unansweredQuestions: 0 }
        }
    }

    static async validateQuestionFormat(answers, question, correctAnswer, category){
        
        const areThereFourAnswers = !Array.isArray(answers) || answers.length!==4
        if(areThereFourAnswers) return { error: "Answers are not formatted correctly."}
        
        if(!Array.isArray(category)) return { error: "Category is not formatted correctly."}

        for (var i=0; i < answers.length; i++) {
            if (answers[i]=="") {
                return { error: "Answer cannot be empty."}
            }    
        }
        
        if (question==="") return { error: "Question cannot be empty."}


        const possibleCorrectAnswers = [0, 1, 2, 3]
        if(!arrayContainsValue(possibleCorrectAnswers, correctAnswer)) return { error: "Chose which answer is correct"}
       
        return ({status: "question is valid"})
    }


    static async getOneCategoryUsersAccuracy(category){
        try {
            let allQuestions = await quiz.find({category: category}).toArray()
            let numberOfCorrectAnswers = 0
            let numberOfBadAnswers = 0
            for(let i = 0; i < allQuestions.length; i++){
                for(let j = 0; j < allQuestions[i].answersFromUsers.length; j++){
                    if(allQuestions[i].answersFromUsers[j].answerFromUser===allQuestions[i].correctAnswer){
                        numberOfCorrectAnswers += 1
                    }
                    else numberOfBadAnswers += 1
                }
            }
            return{
                numberOfCorrectAnswers: numberOfCorrectAnswers,
                numberOfBadAnswers: numberOfBadAnswers,
            }
        }
        catch(e){
            console.log(e)
            return { error: e }
        }
    }

    static async getAllCategoriesStatistics(){
        try {
        
            let categoriesStatistics = []
            let allQuestions = await quiz.find().toArray()
            for(let i = 0; i < allQuestions.length; i++){
                for(let j = 0; j < allQuestions[i].category.length; j++){
                    const result = categoriesStatistics.find( ({ name }) => name === allQuestions[i].category[j] )
                    if(result === undefined){
                        let newCategory = {name: allQuestions[i].category[j], amount: 1}
                        categoriesStatistics.push(newCategory)
                        continue
                    }
                    result.amount += 1
                }
            }
            return categoriesStatistics
        }
        catch(e){
            console.log(e)
            return { error: e }
        }
    }

    static async getOneCategoryUserQuizData(user, category){
        try {
            let allQuestions = await quiz.find({category: category}).toArray()

            if(user===undefined){
                const dataFromCategory = {
                    name:  category, 
                    numberOfCorrectAnswers: 0, 
                    numberOfBadAnswers: 0,
                    numberOfAllQuestions: allQuestions.length  
                }
                return dataFromCategory
            }
            let numberOfCorrectAnswers = 0
            let numberOfBadAnswers = 0
            for(let j=0; j<allQuestions.length; j++){
                const result = allQuestions[j].answersFromUsers.find( (question) => question.user.toString() === user._id.toString() )
                if(result===undefined) continue

                if(allQuestions[j].correctAnswer===result.answerFromUser){
                    numberOfCorrectAnswers += 1
                }
                else numberOfBadAnswers += 1
                
            }
            const dataFromCategory = {
                name:  category, 
                numberOfCorrectAnswers: numberOfCorrectAnswers, 
                numberOfBadAnswers: numberOfBadAnswers,
                numberOfAllQuestions: allQuestions.length  
            }
            return dataFromCategory
        }
        catch(e){
            console.log(e)
            return { error: e }
        }
    }


    static async getAllAuthorsFromCategory(category){
        try{
            let biggestAuthors = await quiz.aggregate([
                {
                  $match:{ category: category }
                },
                {
                  $group: {
                    _id: { user : "$user" },
                    "count": { "$sum": 1 }
                  }
                },
                {
                    $sort:{
                         "count": 1
                    }
                },
                { 
                    $limit : 5 
                },
                {$lookup: {
                    from: "users",
                    let: {
                        user: "$_id.user",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$user"],
                                },
                            },
                        },
                        {
                            $project: {
                                username:1, _id:0
                            },
                        },
                    ],
                    as: "author",
                },    
            },
            {$project: {"_id" : 0}},
            ]).toArray()
            return biggestAuthors
        }
        catch(e){
            console.log(e)
            return { error: e }
        }
    }
}