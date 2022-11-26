import express from "express"
import AuthenticationCtrl from "./authentication.js"
import QuizCtrl from "./quiz.js"
import QuizCategoriesCtrl from "./quizCategories.js"
import authRequired from "../middleware/authRequired.js"
import setUserMiddleware from "../middleware/setUser.js"
import adminPath from "../middleware/adminPath.js"

const router = express.Router()

router.route("/sign-up").post(AuthenticationCtrl.apiSignUp)
router.route("/login").post(AuthenticationCtrl.apiLoginIn)
router.route("/user/data").get(setUserMiddleware, AuthenticationCtrl.apiFetchUserData)
router.route("/quiz/question").post(setUserMiddleware, QuizCtrl.apiAddQuestion)
.get(setUserMiddleware, QuizCtrl.apiGetQuestion) 
router.route("/quiz/question/id/:id").put(setUserMiddleware, QuizCtrl.apiUpdateQuestion)
.delete(authRequired, QuizCtrl.apiDeleteQuestion)
router.route("/quiz/user/stats/").get(setUserMiddleware, QuizCategoriesCtrl.apiGetUserQuizData) 
router.route("/quiz/groups").get(QuizCategoriesCtrl.apiGetAllGroups)
router.route("/quiz/groups").post(adminPath, QuizCategoriesCtrl.apiChangeInGroups)
router.route("/quiz/categories").get(QuizCategoriesCtrl.apiGetAllCategories)


export default router