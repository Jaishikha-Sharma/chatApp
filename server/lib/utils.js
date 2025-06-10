import jwt from "jsonwebtoken"

//func to generate token

export const generateToken = (userId)=>{
const token = jwt.sign({userId} , process.env.JWT_SECRET);
return token
}

