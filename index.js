const express = require('express')
const app = express()
const cors = require('cors')

const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json())




app.get('/', (req, res) => {
  res.send('Hello from the server')
})


const uri = "mongodb+srv://uni_event_server:V2GSIEJyXlcJnnB8@cluster0.n0bjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const uniEventDB = client.db('uniEventDB');
    const UniversityCollection = uniEventDB.collection('universities');
    const ClubCollection = uniEventDB.collection('clubs');
    const EventCollection = uniEventDB.collection('events');
    const userCollestion = uniEventDB.collection('users');
    await client.db("admin").command({ ping: 1 });
    app.post('/uni', async (req, res) => {
      const uni = {

        name: "North South University",
        location: "Dhaka",
        logo: "https://...",
        established: 1992,
        website: "https://nsu.edu.bd"
      }

      const result = await UniversityCollection.insertOne(uni)
      // console.log(result)
      res.send(result)

    })
    app.get('/uni', async (req, res) => {
      const query = req.query;

      const result = await UniversityCollection.find().toArray()
      // console.log(result)
      res.send(result)

    })
    app.get('/club', async (req, res) => {
      const query = req.query;
      const result = await ClubCollection.find().toArray()
      console.log(result)
      res.send(result)

    })
    app.post('/club', async (req, res) => {

      const club = req.body;
      //   console.log(club)
      // console.log("University ID from client:", club.university_id);

      const exist = await UniversityCollection.findOne({ _id: new ObjectId(club.universityId) })
      if (exist) {
        const isCLub = await ClubCollection.findOne({ name: club.name }, { projection: { _id: 1 } });
        //  console.log(isCLub)
        if (isCLub)
          console.log('CLUB IS ALREADY EXIST')
        else {
          const result = await ClubCollection.insertOne(club)
          res.send(result)
        }

      }
      else {
        console.log('UNIVERSITY NOT FOUND')
        res.send({ message: 'UNIVERSITY NOT FOUND' })
      }
      console.log(exist)
    })

    app.get('/users', async (req, res) => {
      const result = await userCollestion.find().toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      //    console.log(user)
      const isExist = await userCollestion.findOne({ email: user.email })
      //    console.log(isExist)
      const university_id = await UniversityCollection.findOne({ name: user.universityName }, { projection: { _id: 1 } })
      console.log(university_id)
      const finalUser = { ...user, university_id: university_id._id }
      //    console.log(finalUser)
      if (!isExist) {
        const result = await userCollestion.insertOne(finalUser)
        res.send(result)
      }
      else {
        console.log('USER ALREADY EXIST')
      }

    })
    app.get('/event', async (req, res) => {
      const result = await EventCollection.find().toArray()
      res.send(result)
    })
    app.post('/event', async (req, res) => {
      const event = req.body;
      // console.log(event)
      const result = await EventCollection.insertOne(event)
      res.send(result)
    })
    app.patch('/event/:id', async (req, res) => {
      const eventId = req.params.id;
      const { status } = req.body;
      console.log(("Event ID:", eventId));
console.log(status)
      if (!["pending", "accepted"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      try {
        const result = await EventCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $set: { status } }
        );

        if (result.modifiedCount > 0) {
          res.json({ success: true });
        } else {
          res.status(404).json({ error: "Event not found or status unchanged" });
        }
      } catch (err) {
        console.error("Error updating event status:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`mysha is running on port ${port}`)
})