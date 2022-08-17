const express = require('express');
const morgan = require('morgan')
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars'); 
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport')
const mongoose = require('mongoose')

require('./config/passport')

mongoose.Promise = global.Promise

mongoose.connect('mongodb+srv://auth:auth@db-auth.va4vw8w.mongodb.net/?retryWrites=true&w=majority')

const handlebars = expressHandlebars.create({ defaultLayout: 'layout' }) 

const app = express();        
app.use(morgan('dev')); 

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars.engine); 
app.set('view engine', 'handlebars');
      
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'xxxx',
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(flash());

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success');
  res.locals.error_messages = req.flash('error');
  res.locals.isAuthenticated = req.user ? req.user : null;
  next();
})

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.render('notFound');
});

app.listen(5000, () => console.log(`Server started listening on port 5000!`));