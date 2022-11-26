import AuthenticationDAO from "../dao/authenticationDAO.js";

const authRequired = async (req, res, next) => {

    await AuthenticationDAO.setUser(req, res, next)
    const user = req.user

    if (!user){
        return res.status(401).json({status: "fail", error: "unauthorized"})
    }
    next()
}

export default authRequired