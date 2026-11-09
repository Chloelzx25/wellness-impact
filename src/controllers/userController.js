const userModel = require("../models/userModel.js");

//////////////////////////////////////////////////////
// READ ALL USERS
//////////////////////////////////////////////////////
module.exports.readAllUser = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllUser:", error);
            res.status(500).json(error);
        } else {
            res.status(200).json(results);
        }
    }

    userModel.selectAll(callback);
}

module.exports.readUserById = (req, res, next) =>
{
    const data = {
        id: req.params.user_id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserById:", error);
            res.status(500).json(error);
        } else {
            if (results.length == 0)
            {
                res.status(404).json({
                    message: "User not found"
                });
            }
            else res.status(200).json(results[0]);
        }
    }

    userModel.selectById(data, callback);
}

/* module.exports.createNewUser = (req, res, next) => 
{
    if (req.body.username === undefined || req.body.username.trim() === "") {
        return res.status(400).send("Error username is undefined");
    }

    const username = req.body.username;
    
    userModel.findUserByUsername(username, (error, results) => {
        if (error) {
            console.error("Error checking username:", error);
            return res.status(500).json(error);
        }

        if (results && results.length > 0) {
            return res.status(409).send("Error username already taken:");
        }

        const data = {
            username: username,
            points: 0
        };


        const callback = (error, results, fields) => {
            if (error) {
                console.error("Error createNewUser:", error);
                return res.status(500).json(error);
            }

            return res.status(201).json({
                user_id: results.insertId,
                username: data.username,
                points: data.points
            });
        };

        userModel.insertSingle(data, callback);
    });
}; */

//////////////////////////////////////////////////////
// REGISTER
//////////////////////////////////////////////////////
module.exports.register = (req, res, next) =>
{
    if (req.body.username == undefined || req.body.email == undefined || req.body.password == undefined)
    {
        res.status(400).json({
            message: "Error: username, email or password is undefined"
        });
    }
    else
    {
        const username = req.body.username;
        const email = req.body.email;

        userModel.findUserByUsername(username, (error, results) => {
            if (error) {
                console.error("Error findUserByUsername:", error);
                res.status(500).json(error);
            } else {
                if (results.length > 0)
                {
                    res.status(409).json({
                        message: "Username already taken"
                    });
                }
                else
                {
                    userModel.findUserByEmail(email, (error, results) => {
                        if (error) {
                            console.error("Error findUserByEmail:", error);
                            res.status(500).json(error);
                        } else {
                            if (results.length > 0)
                            {
                                res.status(409).json({
                                    message: "Email already registered"
                                });
                            }
                            else
                            {
                                const data = {
                                    username: username,
                                    email: email,
                                    password: res.locals.hash,
                                    points: 0,
                                    role: "user"
                                };

                                userModel.insertSingle(data, (error, results) => {
                                    if (error) {
                                        console.error("Error insertSingle:", error);
                                        res.status(500).json(error);
                                    } else {
                                        const userId = results.insertId;

                                        // Starter Amber
                                        const amberData = {
                                            user_id: userId,
                                            character_id: 1,
                                            character_name: "Amber",
                                            element: "Pyro",
                                            class_type: "Archer",
                                            current_hp: 50,
                                            max_hp: 50,
                                            level: 1,
                                            experience: 0,
                                            is_equipped: true,
                                            image_url: "https://static.wikia.nocookie.net/gensin-impact/images/7/75/Amber_Icon.png"
                                        };

                                        userModel.giveStarterCharacter(amberData, (error) => {
                                            if (error) {
                                                console.error("Error giveStarterCharacter:", error);
                                                res.status(500).json(error);
                                            } else {
                                                res.locals.userId = userId;
                                                res.locals.username = username;
                                                res.locals.role = "user";
                                                res.locals.message = "User registered successfully";
                                                next();
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
}

//////////////////////////////////////////////////////
// LOGIN 
//////////////////////////////////////////////////////
module.exports.login = (req, res, next) =>
{
    if (req.body.username == undefined || req.body.password == undefined)
    {
        return res.status(400).json({
            message: "Invalid username or password"
        });
    }
    else
    {
        const username = req.body.username;

        const callback = (error, results, fields) => {
            if (error) {
                console.error("Error login:", error);
                return res.status(500).json(error);
            } else {
                if (results.length == 0)
                {
                    return res.status(401).json({
                        message: "Invalid username or password"
                    });
                }
                else
                {
                    const user = results[0];

                    res.locals.userId = user.user_id;
                    res.locals.username = user.username;
                    res.locals.role = user.role;
                    res.locals.hash = user.password; // for compare middleware
                    res.locals.message = "Login successful";

                    next();
                }
            }
        };

        userModel.findUserByUsername(username, callback);
    }
}

//////////////////////////////////////////////////////
// GET CURRENT USER
//////////////////////////////////////////////////////
module.exports.getCurrentUser = (req, res, next) =>
{
    const userId = res.locals.userId;

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getCurrentUser:", error);
            res.status(500).json(error);
        } else {
            if (results.length == 0)
            {
                res.status(404).json({
                    message: "User not found"
                });
            }
            else res.status(200).json(results[0]);
        }
    }

    // model expects a number, not { user_id: ... }
    userModel.getUserWithCharacter(userId, callback);
}

/* module.exports.updateUserById = (req, res, next) => {
  if (req.body.username == undefined || req.body.username.trim() === "") {
    return res.status(400).json({ message: "Error: username undefined" });
  }

  const username = req.body.username;
  const points = req.body.points;
  const userId = res.locals.userId;
  const role = res.locals.role;

  // ✅ was passing object before; must pass username string
  userModel.findUserByUsername(username, (error, results) => {
    if (error) {
      console.error("Error findUserByUsername:", error);
      return res.status(500).json(error);
    }

    if (results.length > 0 && results[0].user_id != userId) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const proceed = (finalPoints) => {
      const updateData = {
        id: userId,
        username: username,
        points: finalPoints
      };

      const callback = (error, results, fields) => {
        if (error) {
          console.error("Error updateById:", error);
          return res.status(500).json(error);
        }

        if (results.affectedRows == 0) {
          return res.status(404).json({ message: "User not found" });
        } else {
          return res.status(200).json({
            user_id: userId,
            username: username,
            points: finalPoints
          });
        }
      };

      userModel.updateById(updateData, callback);
    };

    if (points != undefined && points != null) {
      if (role != "admin") {
        return res.status(403).json({ message: "Forbidden: only admin can update points" });
      }
      return proceed(points);
    }

    const selectData = { id: userId };

    userModel.selectById(selectData, (error, results) => {
      if (error) {
        console.error("Error selectById:", error);
        return res.status(500).json(error);
      }

      if (results.length == 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return proceed(results[0].points);
    });
  });
}; */

module.exports.readPublicUsers = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readPublicUsers:", error);
            return res.status(500).json(error);
        }
        return res.status(200).json(results);
    };

    userModel.selectPublic(callback);
};