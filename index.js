const express=require("express");
const cors=require("cors");

const app=express();

app.use((req,res,next)=>{

res.header(
"Access-Control-Allow-Origin",
"*"
);

res.header(
"Access-Control-Allow-Methods",
"GET,POST,PATCH,DELETE,OPTIONS"
);

res.header(
"Access-Control-Allow-Headers",
"Content-Type, Authorization"
);

next();

});


app.use(cors());

app.use(express.json());


const URL=process.env.SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_KEY;

const BASE=`${URL}/rest/v1`;



function headers(extra={}){

return {

apikey:KEY,

Authorization:
`Bearer ${KEY}`,

"Content-Type":
"application/json",

...extra

};

}



async function db(path,options={}){


let r=await fetch(

BASE+path,

{

...options,

headers:headers(options.headers||{})

}

);


let text=await r.text();


if(!r.ok){

console.log(
"SUPABASE ERROR:",
text
);

throw new Error(text);

}


return text ? JSON.parse(text):null;


}





app.get("/",(req,res)=>{

res.json({

status:"Aippy API online"

});

});






// CREATE PROFILE

app.post("/profile",async(req,res)=>{


try{


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

created_at:new Date()

})

}

);


res.json({

success:true

});


}catch(e){

res.status(500).json({

error:e.message

});

}


});








// GET FEED

app.get("/feed",async(req,res)=>{


try{


let users=await db(

"/profiles?select=*&order=created_at.desc"

);


res.json(users);


}catch(e){

res.status(500).json({

error:e.message

});

}


});








// RATE USER

app.post("/rate",async(req,res)=>{


try{


let {

rater_id,

rated_user_id,

score

}=req.body;




await db("/ratings",

{

method:"POST",

headers:{

Prefer:
"resolution=merge-duplicates"

},

body:JSON.stringify({

rater_id,

rated_user_id,

score,

created_at:new Date()

})

}

);





let ratings=await db(

`/ratings?select=score&rated_user_id=eq.${encodeURIComponent(rated_user_id)}`

);




let avg=0;



if(ratings.length){

avg=

ratings.reduce(

(a,b)=>a+Number(b.score),

0

)

/ratings.length;

}





await db(

`/profiles?user_id=eq.${encodeURIComponent(rated_user_id)}`,

{

method:"PATCH",

body:JSON.stringify({

average_rating:Number(avg.toFixed(2)),

total_ratings:ratings.length

})

}

);



res.json({

average:avg

});



}catch(e){


res.status(500).json({

error:e.message

});


}


});








// LEADERBOARD

app.get("/leaderboard",async(req,res)=>{


try{


let data=await db(

"/profiles?select=*&order=average_rating.desc"

);


res.json(data);



}catch(e){


res.status(500).json({

error:e.message

});


}


});








// FOLLOW

app.post("/follow",async(req,res)=>{


try{


let {

follower_id,

following_id

}=req.body;



await db("/followers",

{

method:"POST",

headers:{

Prefer:
"resolution=ignore-duplicates"

},

body:JSON.stringify({

follower_id,

following_id,

created_at:new Date()

})

}

);




let count=await db(

`/followers?select=id&following_id=eq.${encodeURIComponent(following_id)}`

);





await db(

`/profiles?user_id=eq.${encodeURIComponent(following_id)}`,

{

method:"PATCH",

body:JSON.stringify({

followers_count:count.length

})

}

);




res.json({

following:true

});



}catch(e){


res.status(500).json({

error:e.message

});


}


});


app.get("/followers/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const data = await db(
      `/followers?select=*&following_id=eq.${encodeURIComponent(user_id)}`
    );

    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/following/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const data = await db(
      `/followers?select=*&follower_id=eq.${encodeURIComponent(user_id)}`
    );

    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/ratings/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const data = await db(
      `/ratings?select=*&rated_user_id=eq.${encodeURIComponent(user_id)}`
    );

    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



const PORT=process.env.PORT||3000;


app.listen(PORT,()=>{

console.log(
"Aippy running on",
PORT
);

});
