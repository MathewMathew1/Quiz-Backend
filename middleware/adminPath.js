import AuthenticationDAO from "../dao/authenticationDAO.js";

const adminPath = async (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader.split(' ')[1]
    let response = await AuthenticationDAO.isUserAdmin(token)
    
    if (!response){
        return res.status(404).json({status: "fail", message: "Not found"})
    }
    next()
}

export default adminPath