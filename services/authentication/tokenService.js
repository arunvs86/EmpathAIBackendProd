import jwt from "jsonwebtoken"
import dotenv from "dotenv"

class TokenService{
    
    geneateAccessToken(user){
        return jwt.sign(
            {id:user.id, role:user.role},
            process.env.JWT_SECRET,
            {expiresIn: '2h'}
        );
    }

    generateRefreshToken(user){
        return jwt.sign(
            {
                id:user.id, role: user.role
            },
            process.env.REFRESH_SECRET,
            {expiresIn: '7d'}
        )
    }

    verifyToken(token,secret = process.env.JWT_SECRET){
        return jwt.verify(token,secret)
    }
}

export default TokenService;