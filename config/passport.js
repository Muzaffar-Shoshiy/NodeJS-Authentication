const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        await User.findById(id);
        done(null, User)
    } catch (error) {
        done(error, null)
    }
})
passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async (email, password, done) => {
    try {
        const user = await User.findOne({'email': email})
        if(!user){
            return done(null, false, { message: 'Unknown user!' })
        }
        const isValid = User.comparePasswords(password, user.password)
        if(!isValid){
            return done(null, false, { message: 'Unknown password' })
        }
        if(!user.active){
            return done(null, false, { message: 'You need to verify email first!' })
        }
        return done(null, user)
    } catch (error) {
        return done(error, false)
    }
}))