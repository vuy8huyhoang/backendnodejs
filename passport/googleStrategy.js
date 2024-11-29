
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../models/database');

passport.use(new GoogleStrategy({
    clientID: '1028960205440-dmf5uq6jih9ht1l1b82uljvbks4jd280.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/',
}, (accessToken, refreshToken, profile, done) => {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    db.query(sql, [profile.id], (err, results) => {
        if (err) {
            return done(err);
        }
        if (results.length > 0) {
            return done(null, results[0]);
        } else {
            const newUser = {
                google_id: profile.id,
                email: profile.emails[0].value,
                ten: profile.displayName,
                hinh: profile.photos[0].value,
                is_verified: 1,
            };
            const insertSql = 'INSERT INTO users SET ?';
            db.query(insertSql, newUser, (err, result) => {
                if (err) {
                    return done(err);
                }
                newUser.id = result.insertId;
                return done(null, newUser);
            });
        }
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return done(err);
        }
        done(null, results[0]);
    });
});
