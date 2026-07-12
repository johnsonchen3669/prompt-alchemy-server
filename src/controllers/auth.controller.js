const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const users = [];
let nextId = users.length + 1;

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: 'false', message: '請填寫 email 與 password' });
    }

    const foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      return res.status(400).json({ status: 'false', message: 'email 已被使用' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: nextId++,
      email,
      password: hashedPassword,
    };
    users.push(newUser);
    res.status(201).json({
      status: 'success',
      message: '註冊成功',
      data: { id: newUser.id, email },
    });
  } catch (error) {
    next(error);
  }
}


// router.post('/register', async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ status: 'false', message: '請填寫 email 與 password' });
//     }

//     const foundUser = users.find((u) => u.email === email);
//     if (foundUser) {
//       return res.status(400).json({ status: 'false', message: 'email 已被使用' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = {
//       id: nextId++,
//       email,
//       password: hashedPassword,
//     };
//     users.push(newUser);
//     res.status(201).json({
//       status: 'success',
//       message: '註冊成功',
//       data: { id: newUser.id, email },
//     });
//   } catch (error) {
//     next(error);
//   }
// });
async function logOut(req, res, next) {

}
function getUser(req, res) {

}

module.exports = { login }