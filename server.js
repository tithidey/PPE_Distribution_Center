var express = require('express');
var path    = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
//const dbConnection = require('./database');
const dbConnection = require('./public/js/database');
const { body, validationResult } = require('express-validator');
const { join } = require('path');

var app = express();
app.use(express.urlencoded({extended:false}));

app.use(express.static(__dirname));


app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');


app.get('/view',(req,res)=>{
    res.render('updatePPE.ejs');
});


// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  24 * 60* 60 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}
const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/');
    }
    next();
}
const ifLoggedins = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.render('updatePPE.ejs');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `name` FROM `record` WHERE `id`=?",[req.session.id])
    .then(([rows]) => {
        res.render('index',{
            name:rows[0].name
        });
    });
    
});// END OF ROOT PAGE

// REGISTER PAGE
app.post('/register', ifLoggedins, 
// post data validation(using express-validator)
[
    body('email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `record` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('name','Username is Empty!').trim().not().isEmpty(),
    body('password','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {name, password, email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(password, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `record`(`name`,`email`,`password`) VALUES(?,?,?)",[name,email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        // res.render('login-register',{
        //     register_error:allErrors,
        //     old_data:req.body
        // });
        res.render('updatePPE', {
            register_error:allErrors,
            old_data: req.body
        });
    }
});// END OF REGISTER PAGE

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('email').custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `record` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('password','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {password, email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `record` WHERE `email`=?",[email])
        .then(([rows]) => {
            bcrypt.compare(password, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id;
                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT


//authority login

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedind = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('authorized');
    }
    next();
}
const ifLoggedind = (req,res,next) => {
    if(req.session.isLoggedIn){
       // return res.redirect('/');
       return  res.render('health_ministry');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/author', ifNotLoggedind, (req,res,next) => {
    dbConnection.execute("SELECT `center` FROM `receiver` WHERE `id`=1",[req.session.id])
    .then(([rows]) => {
        res.render('health_ministry',{
            name:rows[0].center
        });
    });
    
});
// END OF ROOT PAGE


// LOGIN PAGE
app.post('/withdraw', ifLoggedind, [
    body('center').custom((value) => {
        return dbConnection.execute('SELECT `center` FROM `receiver` WHERE `center`="Health Ministry"', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('You are not authorized!');
            
        });
    }),
    body('pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {pass, center} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `receiver` WHERE `center`='Health Ministry'",[center])
        .then(([rows]) => {
            bcrypt.compare(pass, rows[0].pass).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id;

                    res.render('health_ministry');
                }
                else{
                    res.render('authorized',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('authorized',{
            login_errors:allErrors
        });
    }
});

// END OF LOGIN PAGE


// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.render('authorized');
});
// END OF LOGOUT

//division login

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedinde = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('auth');
    }
    next();
}
const ifLoggedinde = (req,res,next) => {
    if(req.session.isLoggedIn){
       // return res.redirect('/');
       return  res.render('division');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/authors', ifNotLoggedinde, (req,res,next) => {
    dbConnection.execute("SELECT `center` FROM `receiver` WHERE `id`=2",[req.session.id])
    .then(([rows]) => {
        res.render('division',{
            name:rows[0].center
        });
    });
    
});
// END OF ROOT PAGE


// LOGIN PAGE
app.post('/withdraw2', ifLoggedinde, [
    body('center').custom((value) => {
        return dbConnection.execute('SELECT `center` FROM `receiver` WHERE `center`="Division"', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('You are not authorized!');
            
        });
    }),
    body('pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {pass, center} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `receiver` WHERE `center`='Division'",[center])
        .then(([rows]) => {
            bcrypt.compare(pass, rows[0].pass).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id;

                    res.render('division');
                }
                else{
                    res.render('auth',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('auth',{
            login_errors:allErrors
        });
    }
});

// END OF LOGIN PAGE


// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.render('auth');
});
// END OF LOGOUT

//hospital login
// DECLARING CUSTOM MIDDLEWARE
const ifNotLog = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login_hospital');
    }
    next();
}
const ifLog = (req,res,next) => {
    if(req.session.isLoggedIn){
       // return res.redirect('/');
       return  res.render('hospital');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/authLog', ifNotLog, (req,res,next) => {
    dbConnection.execute("SELECT `center` FROM `receiver` WHERE `id`=3",[req.session.id])
    .then(([rows]) => {
        res.render('hospital',{
            name:rows[0].center
        });
    });
    
});
// END OF ROOT PAGE


// LOGIN PAGE
app.post('/withdraw3', ifLog, [
    body('center').custom((value) => {
        return dbConnection.execute('SELECT `center` FROM `receiver` WHERE `center`="Authorized Hospital"', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('You are not authorized!');
            
        });
    }),
    body('pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {pass, center} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `receiver` WHERE `center`='Authorized Hospital'",[center])
        .then(([rows]) => {
            bcrypt.compare(pass, rows[0].pass).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id;

                    res.render('hospital');
                }
                else{
                    res.render('login_hospital',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login_hospital',{
            login_errors:allErrors
        });
    }
});

// END OF LOGIN PAGE


// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.render('login_hospital');
});
// END OF LOGOUT


//researcher login
// DECLARING CUSTOM MIDDLEWARE
const ifNotLogg = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login_researcher');
    }
    next();
}
const ifLogg = (req,res,next) => {
    if(req.session.isLoggedIn){
       // return res.redirect('/');
       return  res.render('researcher');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/authLog2', ifNotLogg, (req,res,next) => {
    dbConnection.execute("SELECT `center` FROM `receiver` WHERE `id`=4",[req.session.id])
    .then(([rows]) => {
        res.render('researcher',{
            name:rows[0].center
        });
    });
    
});
// END OF ROOT PAGE


// LOGIN PAGE
app.post('/withdraw4', ifLogg, [
    body('center').custom((value) => {
        return dbConnection.execute('SELECT `center` FROM `receiver` WHERE `center`="Researcher"', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('You are not authorized!');
            
        });
    }),
    body('pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {pass, center} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `receiver` WHERE `center`='Researcher'",[center])
        .then(([rows]) => {
            bcrypt.compare(pass, rows[0].pass).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id;

                    res.render('researcher');
                }
                else{
                    res.render('login_researcher',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login_researcher',{
            login_errors:allErrors
        });
    }
});

// END OF LOGIN PAGE


// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.render('login_researcher');
});
// END OF LOGOUT


app.listen('3300');
console.log('Running at\nhttp://localhost:3300');