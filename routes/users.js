const express = require('express');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport')
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const User = require('../models/user');


//validation schema
const userSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  confirmationPassword: Joi.any().valid(Joi.ref('password')).required()
})

// Authorization
const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()){
    return next()
  }else{
    req.flash('error','Sorry, but you must be registered first!')
    res.redirect('/')
  }
}

const isNotAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()){
    req.flash('error','Sorry, but you must be registered first!')
    res.redirect('/')
  }else{
    return next()
  }
}

router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('register');
  })
  .post(async (req, res, next) => {
    try{
      const result = userSchema.validate(req.body);
      if(result.error){
        req.flash('error', 'Data is not valid. Please try again!');
        res.redirect('/users/register');
        return;
      }
      //checking if email already taken
      const user = await User.findOne({ 'email': result.value.email });
      if(user){
        req.flash('error', 'Email is already in use.');
        res.redirect('/users/register');
        return;
      }
      // hash the password
      const hash = await User.hashPassword(result.value.password);

      // generate secret token
      const secretToken = randomstring.generate();
      result.value.secretToken = secretToken;

      // flag account as inactive
      result.value.active = false;

      //save user to db
      delete result.value.confirmationPassword;
      result.value.password = hash;
      const newUser = await new User(result.value);
      await newUser.save();

      // compose mail
      const html = `Hi there, 
      <br/>
      Thank you for registering!
      <br/><br/>
      Please verify your email by typing the folowing token:
      <br/>
      Token: <b>${secretToken}</b>
      <br/>
      On the following page: 
      <a href="http://localhost:5000/users/verify">http://localhost:5000/users/verify</a>
      <br/><br/>
      Have a pleasant day!`;

      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'nodemailertest26@gmail.com',
            pass: 'a p o u v k f l b q l m m h v t'
        }
      })
      
      const details = {
          from: 'nodemailertest26@gmail.com',   
          to: result.value.email,
          subject: 'Please verify your email.',
          text: 'Please get secret token and move website page through link provided below and paste it verification input! Good luck!',
          html: html,
      }
    
      transport.sendMail(details, (err) => {
          if(err){
              console.log('Something went wrong...', err)
          }else{
              console.log('Email was sent successfully....!')
          }
      })


      req.flash('success','Please check your email!');
      res.redirect('/users/verify');   

  }catch(error){
    next(error);
  }
  });

router.route('/login')
  .get(isNotAuthenticated, (req, res) => {
    res.render('login');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }))

router.route('/dashboard')
  .get(isAuthenticated, async (req, res) => {
    res.render('dashboard', { username: req.body.username })
  })

router.route('/verify')
  .get(isNotAuthenticated, (req, res) => {
    res.render('verify')
  })
  .post(async (req, res, next) => {
    try {
      const { secretToken } = req.body;

      const user = await User.findOne({ 'secretToken': secretToken.trim() });
      if(!user){
        req.flash('error', 'No user found.');
        res.redirect('/users/verify');
        return;
      }
      user.active = true;
      user.secretToken = '';
      await user.save();

      req.flash('success', 'Now you may log in!');
      res.redirect('/users/login');
    } catch (error) {
        next(error);
    }
  })

router.route('/logout')
  .get(isAuthenticated, (req, res) => {
    req.logout((err) => {
      if(err){
        console.log('Somthing went wrong...')
      }else{
        req.flash('success','Successfully logged out. Hope to see you soon!')
        res.redirect('/')
      }
    })
  })

router.route('/profile')
  .get(isAuthenticated, (req, res) => {
      // console.log(req.user)
      res.send('Welcome to My profile, now this page is under construction...')
      console.log('Sorry, something went wrong...')
  })
module.exports = router;