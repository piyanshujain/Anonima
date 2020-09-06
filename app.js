var express               = require("express"),
    mongoose              = require("mongoose"),
    passport              = require("passport"),
    bodyParser            = require("body-parser"),
    Anon                  = require("./models/anon"),
    User                  = require("./models/user"),
    Comment               = require("./models/comment"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    expressSanitizer      = require("express-sanitizer")
    passport              = require('passport'),
    util                  = require('util'),
    methodOverride        = require('method-override')

mongoose.connect("mongodb://localhost/auth_demo_app",  {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride('_method'));
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

//Routes


app.get("/", function(req, res){
    res.redirect("/anons");
});
app.get("/anons", function(req, res){
    Anon.find({}, function(err, anons){
        if(err){
            console.log(err);
        } else {
            res.render("index", {anons: anons});
        }
    })
});
app.get("/anons/new",isLoggedIn, function(req, res){
   res.render("new");
});
app.post("/anons", function(req, res){
   var name = req.body.name;
   var image = req.body.image;
   var body = req.body.body;
   var author = {
          id: req.user._id,
          username: req.user.username
      }
var formData = {title: name, image: image, body:body, author:author}
   Anon.create(formData, function(err, newAnon){
       console.log(newAnon);
      if(err){
          res.render("new");
      } else {
          res.redirect("/anons");
      }
   });
});
app.get("/anons/:id", function(req, res){
   Anon.findById(req.params.id).populate("comments").exec(function(err, anon){
      if(err){
          res.redirect("/");
      } else {
          res.render("show", {anon: anon});
      }
   });
});
app.get("/anons/:id/comments/new", isLoggedIn, function(req, res){
    Anon.findById(req.params.id, function(err, anon){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {anon:anon});
        }
    })
});
app.post("/anons/:id/comments",isLoggedIn,function(req, res){
   Anon.findById(req.params.id, function(err, anon){
       if(err){
           console.log(err);
           res.redirect("/anons");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
             comment.author.id = req.user._id;
              comment.author.username = req.user.username;
              comment.save();
               anon.comments.push(comment);
               anon.save();
               res.redirect('/anons/' + anon._id);
           }
        });
       }
   });

});
app.post("/anons/:id/anoncomments",isLoggedIn,function(req, res){
   Anon.findById(req.params.id, function(err, anon){
       if(err){
           console.log(err);
           res.redirect("/anons");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
             comment.author.id = req.user._id;
              comment.author.username = 'anonymously';
              comment.save();
               anon.comments.push(comment);
               anon.save();
               res.redirect('/anons/' + anon._id);
           }
        });
       }
   });

});


//Authentication Routes
app.get("/register", function(req, res){
   res.render("register");
});
app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){

           res.redirect("/");
        });
    });
});
app.get("/login", function(req, res){
   res.render("login");
});
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}) ,function(req, res){
});
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(3000, function(){
    console.log("server started.......");
})
