const express=require('express')
const passport=require('passport')
const GoogleStategy=require('passport-google-oauth20').Strategy
const FacebookStategy=require('passport-facebook').Strategy

const keys=require('./config/key')
const app=express();
const PORT=process.env.PORT || 5000

const mongoose=require('mongoose',{ useUnifiedTopology: true });
const URL="mongodb://localhost:27017/OAuthDB";
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true },()=>{
  console.log("MongoDB Connected");
})
require('./model/User')

const cookieSession=require('cookie-session');
const cookiekey='asdfdf231434'//any
app.use(
  cookieSession({
//expire after 30 days
 maxAge:30*24*60*60*1000,
 keys:[cookiekey]
  })
)
app.use(passport.initialize());
app.use(passport.session());


const User=mongoose.model('users');

passport.serializeUser((user,done)=>{
  done(null,user.id)
})
passport.deserializeUser((id,done)=>{
User.findById(id).then((user)=>{
  done(null,user)
})
})


passport.use(
new GoogleStategy({
clientID:keys.googleClientID,
clientSecret:keys.googleClientSecret,
  callbackURL:'/auth/google/callback'
},(token, tokenSecret, profile, done)=>{
User.findOne({googleId:profile.id}).then((existinguser)=>{
  if(existinguser){
    done(null,existinguser)
  }else{
    new User({
      googleId:profile.id,
      username:profile.displayName,
      picture:profile._json.picture
    }).save().then((user)=>{
      done(null,user)
    })
  }
})
 }))

 passport.use(
 new FacebookStategy({
 clientID:keys.fbClientID,
 clientSecret:keys.fbClientSecret,
   callbackURL:'/auth/facebook/callback'
 },(token, tokenSecret, profile, done)=>{
   console.log(profile);
 User.findOne({googleId:profile.id}).then((existinguser)=>{
   if(existinguser){
     done(null,existinguser)
   }else{
     new User({
       googleId:profile.id,
        username:profile.displayName
      // picture:profile._json.picture
     }).save().then((user)=>{
       done(null,user)
     })
   }
 })
  }))

app.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get("/",(req,res)=>{
  res.send("Hello");
});

app.get('/auth/google/callback',passport.authenticate('google'),(req,res)=>{
  res.redirect('/profile');
})
app.get('/auth/facebook/callback',passport.authenticate('facebook'),(req,res)=>{
res.redirect('/profile');
})
app.get('/api/current_user',(req,res)=>{
res.send(req.user)
})
app.get('/api/logout',(req,res)=>{
req.logout();
//res.send(req.user);
res.redirect('/');
})
app.listen(PORT,()=>{
  console.log("Server started on "+PORT);
})
