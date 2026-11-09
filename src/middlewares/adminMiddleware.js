const userModel = require("../models/userModel.js");

module.exports.verifyAdmin = (req, res, next) => {
    const userId = res.locals.userId;
    
    userModel.selectById({ id: userId }, (error, results) => {
        if (error) {
            console.error("Error verifying admin:", error);
            return res.status(500).json(error);
        }
        
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ 
                message: "Admin access required" 
            });
        }
        
        next();
    });
};