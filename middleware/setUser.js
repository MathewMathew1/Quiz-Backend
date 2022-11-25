

import AuthenticationDAO from "../dao/authenticationDAO.js";

const setUserMiddleware = async (req, res, next) => {
    await AuthenticationDAO.setUser(req)
    next()
}

export default setUserMiddleware