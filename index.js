const express=require("express");
const cors=require("cors");


const app=express();


app.use(cors({
    origin: "*",
    methods: ["GET","POST","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());
app.use(express.json());



const URL=process.env.SUPABASE_URL;

const KEY=process.env.SUPABASE_SERVICE_KEY;


const BASE=`${URL}/rest/v1`;



function headers(){

return {

apikey:KEY,

Authorization:
`Bearer ${KEY}`,

"Content-Type":
"application/json"

}

}




async function db(path,options={}){


let r=await fetch(

BASE+path,

{

...options,

headers:headers()

}

);


let text=await r.text();


return text ? JSON.parse(text):null;


}





app.get("/",(req,res)=>{

res.json({

status:"Aippy API online"

});

});






// CREATE PROFILE

app.post("/profile",async(req,res)=>{


let {

user_id,

username,

avatar_url,

ip_address


}=req.body;



await db("/profiles",
{

method:"POST",

headers:{
Prefer:
"resolution=merge-duplicates"
},

body:JSON.stringify({

user_id,

username,

avatar_url,

ip_address,

created_at:
new Date(),

})

});


res.json({
success:true
});


});








// GET USERS FEED


app.get("/feed",async(req,res)=>{


let users=await db(

"/profiles?select=*&order=created_at.desc"

);


res.json(users);


});







// RATE


app.post("/rate",async(req,res)=>{


let {

rater_id,

rated_user_id,

score

}=req.body;



await db("/ratings",
{

method:"POST",

body:JSON.stringify({

rater_id,

rated_user_id,

score,

created_at:new Date()

})

});



let ratings=await db(

`/ratings?select=score&rated_user_id=eq.${rated_user_id}`

);



let avg=

ratings.reduce(
(a,b)=>a+Number(b.score),0
)
/ratings.length;



await db(

`/profiles?user_id=eq.${rated_user_id}`,

{

method:"PATCH",

body:JSON.stringify({

average_rating:
avg,

total_ratings:
ratings.length

})

}

);



res.json({

average:avg

});


});








// LEADERBOARD


app.get("/leaderboard",async(req,res)=>{


let data=await db(

"/profiles?select=*&order=average_rating.desc"

);


res.json(data);


});







// FOLLOW


app.post("/follow",async(req,res)=>{


let {

follower_id,

following_id

}=req.body;



await db("/followers",
{

method:"POST",

body:JSON.stringify({

follower_id,

following_id,

created_at:new Date()

})

});



let count=await db(

`/followers?select=id&following_id=eq.${following_id}`

);



await db(

`/profiles?user_id=eq.${following_id}`,

{

method:"PATCH",

body:JSON.stringify({

followers_count:
count.length

})

}

);



res.json({

following:true

});


});






const PORT=process.env.PORT||3000;


app.listen(PORT,()=>{

console.log("Aippy running");

});
