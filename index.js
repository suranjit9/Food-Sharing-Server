const express = require('express');
const multer = require('multer');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// MedalWar.........
app.use(cors({
  origin:['http://localhost:5174'],
  credentials:true
}));
app.use(cookieParser())
app.use(express.json());

// Middlawar---
const veryfyToken = (req, res, next) =>{
  const token = req.cookies?.token;
  console.log('taken veryfy', token);
  if (!token) {
    return res.status(401).send({message: 'Unauthorized access'})
  }else{
    jwt.verify(token, process.env.TOKEN_ACC, (err, decoded)=>{
      if (err) {
        return res.status(401).send({message: 'Unauthorized access'})
      }else{
        req.user = decoded;
        next();
      }
    })
  }

  // next()
}



const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PSS}@cluster0.gzl03ny.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_ID, process.env.DB_PSS)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    const userData = client.db('Food-sharing').collection('Data');
    const foodData = client.db('Food-sharing').collection('AllFood');
    const requstfood = client.db('Food-sharing').collection('Requstfood');
    // Auth 
    app.post("/jwt", async(req, res)=>{
      const user = req.body;
      console.log("user", user);
      const token = jwt.sign(user, process.env.TOKEN_ACC, {expiresIn:"1h"})
      res.cookie('token',token, {
        httpOnly: true,
        secure:true,
        sameSite:'none'
      })
      .send({token})
    })
    // logout jwt
    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log('logout',user);
      res.clearCookie('token', {maxAge:0}).send({suss:true})
    })

    app.post('/user', async (req, res) => {
      const userDataFromRequest  = req.body;
      const result = await userData.insertOne(userDataFromRequest );
      res.send(result)
    })
    app.patch('/user', async (req, res) => {
      const userDataFromRequest = req.body;
      const UesrEmail = { email: userDataFromRequest.email };
      const ubdateDoc = {
        $set: {
          listTimeLogin: userDataFromRequest.listTime
        }
      }
      const result = await userData.updateOne(UesrEmail, ubdateDoc);
      res.send(result)
    })
    // User data get.........
    app.get('/user', async (req, res) => {
      //    const userEmail = req.query;
      //    console.log(query) ;
      console.log(req.query.email)

      let query = {};
      console.log(req.query?.email)
      if (req.query && req.query.email) {
        query = { email: req.query?.email }
      }
      const result = await userData.find(query).toArray();
      res.send(result)
    })
    // AddFood ..............
    app.post("/addFood", async (req, res) => {
      const food = req.body;
      const result = await foodData.insertOne(food);
      res.send(result)
    })
    // ---------------------------------------------------------------
    // Route to handle form submission

    // ---------------------------------------------------------------
    app.get('/addFood', async (req, res) => {

      const find = foodData.find();
      const result = await find.toArray();
      // const result2 = result.slice(0, 8);
      res.send(result);
    })
    // all Food Get.... Available Food page
    app.get('/addFood/Available', async (req, res) => {
      const filter = req.query;
      console.log(filter)
      const query = {
        // FoodStatus:{$in:"available"}
        foodName: { $regex: filter.search, $options: 'i' },
        FoodStatus: { $ne: "Uavailable" }
      };
      const option = {
        sort: {
          Quantity: filter.sort === 'asc' ? 1 : -1

        },
      };
      // console.log(option)
      // const result = await foodData.find(query, option, { "FoodStatus": { $ne: "Available" } }).toArray();
      const result = await foodData.find(query).sort(option.sort).toArray();
      res.send(result)
    })
    // QTY High to Low--------- Home page 
    app.get('/addFood/filter', async (req, res) => {
      const filter = req.query;
      const query = {
        // FoodStatus:{$in:"available"}
        // Quantity:{$gt:5},
        FoodStatus: { $ne: "Uavailable" },
        foodName: { $regex: filter.search, $options: "i" }
      };
      const option = {
        sort: {
          Expired: 1

        },
      };
      // const result = await foodData.find(query, option).limit(12).toArray();
      const result = await foodData.find(query).sort(option.sort).limit(12).toArray();
      res.send(result)
    })
    // FoodStatus & currant Time change.............
    app.patch('/addFood/time/:id', async (req, res) => {
      const id = req.params.id;
      const Status = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          FoodStatus: Status.FoodStatus
          // Expired: Status.Expired
        },
      };
      const result = await foodData.updateOne(filter, updateDoc)
      res.send(result)
    })
    // ManageFoods................
    app.get('/ManageFoods',veryfyToken, async (req, res) => {
      console.log('hello cookkkkk',req.user)
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: "Forbidden Access"})
      }
      let query = {};
      // console.log(req.query?.email)
      if (req.query?.email) {
        query = { email: req.query?.email }
      }
      const result = await foodData.find(query).toArray();
      res.send(result)
    })
    //Uploded food delete data-----
    app.delete(`/ManageFoods/delete/:id`, async (req, res) => {
      const id = req.params.id;
      console.log({ id })
      const filter = { _id: new ObjectId(id) };
      const result = await foodData.deleteOne(filter);
      // if error Handle 
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      res.send(result);
    })
    app.delete(`/SentRe/delete/:id`,async (req, res)=>{
      const id = req.params.id;
      console.log({ id })
      const filter = { _id: new ObjectId(id) };
      const result = await requstfood.deleteOne(filter);
      res.send(result);
    })
    // SingalFood--------------
    app.get('/addFood/SingalFood/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await foodData.findOne(query);
      // console.log(result)
      res.send(result)
    })
    // customer requstFood 
    app.post(`/requstFood`,veryfyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: "Forbidden Access"})
      }
      const query = req.body;
      const result = await requstfood.insertOne(query);
      res.send(result)
    })
    // Admin Food Re Get.......
    app.get(`/requstFood/foodWoner/`,veryfyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: "Forbidden Access"})
      }
      let query = {};
      console.log('Doner email', req.query?.email)
      console.log('Doner email44444444444',query)
      if (req.query?.email) {
        query = { doneremail: req.query?.email }
      }
      const result = await requstfood.find(query).toArray();
      console.log({result})
      res.send(result)
    })
    app.patch(`/requstFood/foodWoner/:id`, async(req, res)=>{
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          foodRequst: status.foodRequst
        },
      };
      const result = await requstfood.updateOne(query, updateDoc);
      res.send(result)
    })
    app.get(`/requstFood/sentreQ/`,veryfyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: "Forbidden Access"})
      }
      let query = {};
      console.log('Doner email', req.query?.email)
      console.log('Doner email44444444444',query)
      if (req.query?.email) {
        query = { coustomerEmail: req.query?.email }
      }
      const result = await requstfood.find(query).toArray();
      console.log({result})
      res.send(result)
    })
    // Get Food by Food Admin -----------
    app.get(`/addFood/Updatefood/:id`, async(req, res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await foodData.findOne(filter);
      res.send(result)
    })
    // Update Food by Food Admin -----------
    app.put(`/addFood/Updatefood/:id`, async(req,res)=>{
      const id = req.params.id;
      const query = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: query // Using $set operator to update specified fields
      };
      const result = await foodData.updateOne(filter, updateDoc);
      res.send(result)

    })
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!Pitu')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})