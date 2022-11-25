import AuthenticationDAO from "../dao/authenticationDAO.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export default class AuthenticationCtrl {
    static async apiSignUp(req, res, next){
        const username = req.body.username
        if(username.length<4) {
            res.status(403).json({error: "Username too short"}) 
            return
        }

        const password = req.body.password
        if(password.length<8) {
            res.status(403).json({error: "Password too short"}) 
            return
        }
        const commonPasswords = await import("../common-passwords-list.js")

        for (let i=0; i < commonPasswords["commonPasswords"].length; i++) {
            if (commonPasswords["commonPasswords"][i]==password) {
                res.status(403).json({error: "Password too common"})
                return
            }    
        };
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        
        let response = await AuthenticationDAO.createUser(hashedPassword, username)
        let{ error } = response

        if (error) {
            res.status(400).json({error: "Username already exist" })
            return
        }
        res.status(201).json({status: "Account created"})
    }

    static async apiLoginIn(req, res, next){
        try{
            const username = req.body.username
            const password = req.body.password
            
            let response = await AuthenticationDAO.validateUser(password, username)
            
            let { error } = response
            
            if (error) {
                res.status(400).json({error: "Incorrect password or username" })
                return
            }
            const accessToken = jwt.sign(response.id, process.env.ACCESS_TOKEN_SECRET)
            res.json({accessToken: accessToken})
        }
        catch (e) {
            console.log(e)
            res.status(500).json({ error: "Something went wrong try again" })
        }
    }


    static async apiFetchUserData(req, res, next){
        try{
            console.log({user: req.user})
            return res.json({user: req.user}) 
        }
        catch (e) {
            console.log(e)
            res.status(500).json({ error: "Something went wrong try again" })
          }
    }
}