const express = require('express')
const app = express()
const port = process.env.PORT || 5000 ;
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');


// MedalWar.........
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PSS}@cluster0.gzl03ny.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_ID,process.env.DB_PSS)
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
    const UserData = client.db('Food-sharing').collection('Data');
    const FoodData = client.db('Food-sharing').collection('AllFood');
    app.post('/user',async(req, res)=>{
        const userdata = req.body;
        const result = await UserData.insertOne(userdata);
        res.send(result)
    })
    app.patch('/user', async(req, res)=>{
        const userdata = req.body;
        const UesrEmail = {email:userdata.email};
        const ubdateDoc ={
            $set:{
              listTimeLogin:userdata.listTime
            }
          }
        const result = await UserData.updateOne(UesrEmail,ubdateDoc);
        res.send(result)
    })
    // User data get.........
    app.get('/user', async(req, res)=>{
    //    const userEmail = req.query;
    //    console.log(query) ;
    console.log(req.query.email)

       let query ={};
       console.log(query)
       if (req.query?.email) {
        query = {email: req.query?.email}
       }
       const result = await UserData.find(query).toArray();
      res.send(result)
    })
    // AddFood ..............
    app.post("/addFood", async(req, res)=>{
        const food = req.body;
        const result = await FoodData.insertOne(food);
        res.send(result)
    })
    // all Food Get....
    app.get('/addFood', async(req, res)=>{

        const result = await FoodData.find().toArray();
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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})