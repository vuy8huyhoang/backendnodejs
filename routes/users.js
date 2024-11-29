var express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const secret = crypto.randomBytes(64).toString('hex');
const JWT_SECRET = secret;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex'); 
const JWT_EXPIRATION = '1h';
const REFRESH_TOKEN_EXPIRATION = '7d';
var router = express.Router();
var db = require('../models/database');

const saltRounds = 10; 

router.get('/', function(req, res, next) {
  res.send(`respond with a resource ${process.env.JWT_SECRET}`);

});

router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email']
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const payload = { email: req.user.email, ten: req.user.ten, id: req.user.id };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

    res.status(200).json({
      message: 'Đăng nhập với Google thành công',
      user: req.user,
      accessToken,
      refreshToken,
    });
  }
);



router.post('/login', (req, res) => {
  const { email, mat_khau } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi máy chủ' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const user = results[0];



    bcrypt.compare(mat_khau, user.mat_khau, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi máy chủ' });
      }
      if (!isMatch) {
        return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
      }
      if (user.is_verified === 0) {
        return res.status(401).json({ message: 'Vui lòng xác minh tài khoản trước khi đăng nhập' });
      }
      delete user.mat_khau;

      const payload = { email: user.email, ten: user.ten, id: user.id };
      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

      return res.status(200).json({
        message: 'Đăng nhập thành công',
        user,
        accessToken,
        refreshToken,
      });
    });
  });
});

router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];

  // Kiểm tra tính hợp lệ của token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi máy chủ' });
      }
      if (results.length === 0) {
        return res.status(400).json({ message: 'Người dùng không tồn tại' });
      }

      const currentUser = results[0];

      bcrypt.compare(currentPassword, currentUser.mat_khau, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: 'Lỗi máy chủ' });
        }
        if (!isMatch) {
          return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
        }

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
          if (err) {
            return res.status(500).json({ error: 'Lỗi khi mã hóa mật khẩu' });
          }

          const updatePasswordSql = 'UPDATE users SET mat_khau = ? WHERE id = ?';
          db.query(updatePasswordSql, [hashedPassword, user.id], (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Lỗi khi cập nhật mật khẩu' });
            }

            res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công' });
          });
        });
      });
    });
  });
});


router.get('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1]; 

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    res.status(200).json({
      message: 'Lấy thông tin người dùng thành công',
      user: {
        id: user.id,
        email: user.email,
        ten: user.ten,
        hinh: user.hinh,
        so_dien_thoai: user.so_dien_thoai,
        ngay_sinh:user.ngay_sinh,
      },
    });
  });
});

router.post('/add', (req, res) => {
  const { ten, mat_khau, email } = req.body;

  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra email' });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    bcrypt.hash(mat_khau, saltRounds, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi khi mã hóa mật khẩu' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      const sql = 'INSERT INTO users SET ?';
      const newUser = { ten, mat_khau: hash, email, verification_token: verificationToken, is_verified: false };

      db.query(sql, newUser, (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng ký' });
        }

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure:  true, 
          auth: {
            user: 'dacsandalatstore@gmail.com',
            pass: 'otfv llev uoxq nzja',
          },
        });

        const verificationLink = `http://localhost:3000/verify-email/${verificationToken}`;

        const mailOptions = {
          from: 'Vũ Store',
          to: email,
          subject: 'Xác thực email của bạn',
          text: `Vui lòng nhấn vào liên kết sau để xác thực email của bạn: ${verificationLink}`,
          html: `<p>Vui lòng nhấn vào liên kết sau để xác thực email của bạn: <a href="${verificationLink}">${verificationLink}</a></p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Lỗi khi gửi email xác thực:', error);
            return res.status(500).json({ error: 'Lỗi khi gửi email xác thực' });
          }
          console.log('Email đã được gửi:', info.response);
          res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.' });
        });


      });
    });
  });
});

router.get('/verify-email', (req, res) => {
  const { token } = req.query;

  console.log('Token nhận được từ frontend:', token);
  console.log('Request Query:', req.query);

  if (!token) {
    return res.status(400).json({ message: 'Thiếu token xác thực' });
  }

  const sql = 'SELECT * FROM users WHERE verification_token = ?';
  db.query(sql, [token], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra token' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    const user = results[0];
    const updateSql = 'UPDATE users SET is_verified = ?, verification_token = NULL WHERE id = ?';
    db.query(updateSql, [true, user.id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái xác thực' });
      }
      res.status(200).json({ message: 'Tài khoản đã được xác thực thành công',status:200 });
    });
  });
});


router.post('/resend-verification-email', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email là bắt buộc' });
  }

  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra email' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const user = results[0];

    if (user.is_verified) {
      return res.status(400).json({
        message: 'Tài khoản đã được xác thực',
        
       });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const updateTokenSql = 'UPDATE users SET verification_token = ? WHERE id = ?';

    db.query(updateTokenSql, [verificationToken, user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật token xác thực' });
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'dacsandalatstore@gmail.com',
          pass: 'otfv llev uoxq nzja',
        },
      });

      const verificationLink = `http://localhost:3000/verify-email/${verificationToken}`;

      const mailOptions = {
        from: 'Vũ Store',
        to: email,
        subject: 'Gửi lại xác thực email của bạn',
        text: `Vui lòng nhấn vào liên kết sau để xác thực email của bạn: ${verificationLink}`,
        html: `<p>Vui lòng nhấn vào liên kết sau để xác thực email của bạn: <a href="${verificationLink}">${verificationLink}</a></p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Lỗi khi gửi email xác thực:', error);
          return res.status(500).json({ message: 'Lỗi khi gửi email xác thực' });
        }
        console.log('Email đã được gửi:', info.response);
        res.status(200).json({ message: 'Đã gửi lại email xác thực. Vui lòng kiểm tra email của bạn.' });
      });
    });
  });
});









router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Không có refresh token' });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ' });
    }

    const accessToken = jwt.sign({ email: decoded.email, ten: decoded.ten, id: decoded.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    return res.status(200).json({
      accessToken, 
    });
  });
});




module.exports = router;
