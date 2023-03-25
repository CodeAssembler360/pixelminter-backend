const jwt = require("jsonwebtoken");

exports.requireValidToken = (req, res, next) => {
  let token = req.header("Authorization");
  // const { authorization } = req.headers;
  if (!token) {
    return res
      .status(401)
      .json({ msg: "Authorizaton denied", success: false, data: {} });
  }

  try {
    // jwt.verify(authorization, jwtSecret.jwt.secret);
    // const { id, email } = jwt.decode(authorization);
    // req.user = { id: id, email: email };
    let authString = token.split(" ");
    let decoded = jwt.verify(authString[1], process.env.jwtSecret);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).send({ msg: "Invalid token", success: false });
  }
};
