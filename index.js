const express = require('express')
const app = express()
const cors = require('cors')
const axios = require('axios');
const port = process.env.PORT || 5000;
const qs = require('qs');
// const serverless = require('serverless-http');

require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { isValidElement } = require('react');

const corsOptions = {
  origin: ['http://localhost:5173','https://univarsity-event.web.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded());
app.get('/', (req, res) => {
  res.send('Hello from the server')
})


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.n0bjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
    const participantCollection = uniEventDB.collection('participants');
    const paymentCollection = uniEventDB.collection('payments');
    const wishlistCollection = uniEventDB.collection('wishlists');
    const newsCollection = uniEventDB.collection('news');
    const favouriteCollection = uniEventDB.collection('favourites')
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
      // console.log(result)
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
    app.patch('/club', async (req, res) => {
      const id = req.body.id
      const name = req.body.name
      console.log(req.body)
      const result = await ClubCollection.updateOne({ _id: new ObjectId(id) }, { $set: { name: name } })
      res.send(result)
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
    app.patch('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollestion.findOne({ email: email })

      console.log(req.body)
      const name = req.body.name
      const newPass = req.body.newPass;
      const oldPass = req.body.oldPass

      if (name) {
        const result = await userCollestion.updateOne({ email: email }, { $set: { name: name } })
        res.send(result)
      }
      else if (oldPass && newPass && user?.password == oldPass) {
        const result = await userCollestion.updateOne({ email: email }, { $set: { password: newPass } })
        res.send(result)
      }
      else {
        res.send("password doesnt match")
      }


    })
    app.get('/event', async (req, res) => {
      const {query ,email } = req.query;
      console.log("query:", query);
      console.log(email)
      let allEvents = [];

      try {
        allEvents = await EventCollection.find({}).toArray(); // ensure plain object
      } catch (err) {
        return res.status(500).send({ error: "Failed to fetch events" });
      }

      let filtered = [];
      const now = new Date();
      if (!query || query === 'all') {
        return res.send(allEvents);
      }
      if(query==='event_manager'){
        const filteredEvent=allEvents.filter(ev => ev.eventManageEmail === email)
        res.send(filteredEvent)
      }
     else if (query === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        filtered = allEvents.filter(e => {
          const d = new Date(e.eventDate);
          return d >= start && d <= end;
        });

      } else if (query === 'week') {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 7);

        filtered = allEvents.filter(e => {
          const d = new Date(e.eventDate);
          return d >= start && d <= end;
        });

      } else if (query === 'month') {
        const start = new Date();
        const end = new Date();
        end.setMonth(start.getMonth() + 1);

        filtered = allEvents.filter(e => {
          const d = new Date(e.eventDate);
          return d >= start && d <= end;
        });

      } else {
        filtered = allEvents;
      }

      res.send(filtered);
    });

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
     app.get('/participants', async (req, res) => {
       const result= await participantCollection.find({}).toArray()
       res.send(result)
    })
    app.put('/participants', async (req, res) => {
      const participant = req.body;
      console.log(participant)
      const isExist = await participantCollection.findOne({ email: participant.email, eventId: participant.eventId })
      if (isExist) {
        console.log('ALREADY PARTICIPATED')
        res.send({ message: 'ALREADY PARTICIPATED' })
      }
      else {
        const result = await participantCollection.insertOne(participant)
        res.send(result)
      }
    })
    app.get('/wishlist', async (req, res) => {

      try {
        const result = await wishlistCollection.find().toArray();
        console.log("Fetched wishlist:", result); // <- This helps debug
        res.send(result);
      } catch (err) {
        console.error("Wishlist GET error:", err);
        res.status(500).send({ error: 'Something went wrong' });
      }
    })
    app.post('/wishlist/:email',

      async (req, res) => {
        const wish = req.body;
        const email = req.params.email;
        console.log(wish)
        const isExist = await participantCollection.findOne({ email: email, eventId: wish.eventId })
        if (!isExist) {
          const result = await wishlistCollection.insertOne(wish)
          res.send(result);
        }
        else {
          console.log('ALREADY WISHLISTED')
          res.send({ message: 'ALREADY WISHLISTED' })

        }
      })
    app.delete('/wishlist/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await wishlistCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount > 0) {
          res.send({ success: true, message: "Wishlist item deleted", deletedCount: result.deletedCount });
        } else {
          res.status(404).send({ success: false, message: "Wishlist item not found" });
        }
      } catch (error) {
        console.error("Error deleting wishlist:", error);
        res.status(500).send({ success: false, message: "Internal server error" });
      }
    });
    //     Store ID: mysha67a089e21f898
    // Store Password (API/Secret Key): mysha67a089e21f898@ssl
    app.post('/create-ssl-payment', async (req, res) => {
      const payment = req.body;
      // console.log(payment, "payment")
      const trxid = new ObjectId().toString();
      payment.trxId = trxid;

      payment.paymentStatus = "pending"; // optional
      payment.createdAt = new Date(); // optional
      await paymentCollection.insertOne(payment);
      const initiate = {
        store_id: "mysha67a089e21f898",
        store_passwd: "mysha67a089e21f898@ssl",
        currency: "BDT",
        total_amount: `${payment.paymentAmount}`,
        tran_id: trxid,
        success_url: "https://club-event-management-server.onrender.com/success-payment",
        fail_url: "https://club-event-management-server.onrender.com/fail",
        cancel_url: "https://club-event-management-server.onrender.com/cancel",
        ipn_url: "https://club-event-management-server.onrender.com/ipn-success-payment",
        cus_name: "Customer Name",
        cus_email: `${payment.userEmail}`,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: "1000",
        ship_country: "Bangladesh",
        multi_card_name: "mastercard,visacard,amexcard",
        value_a: "ref001_A",
        value_b: "ref002_B",
        value_c: "ref003_C",
        value_d: "ref004_D",
        product_name: "Event Ticket",
        product_category: "Education",
        product_profile: "general",
        shipping_method: "NO",
      };

      const formBody = qs.stringify(initiate);
      const response = await axios({
        url: 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
        method: 'POST',
        data: formBody,
        headers: {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',

          }

        }
      });
      const paymentUrl = response?.data?.GatewayPageURL;

      res.send({ paymentUrl })

    })
    app.get('/payments', async (req, res) => {
      const pay = await paymentCollection.find().toArray()
      res.send(pay)
    })
    app.get('/payments/:email/:trxid', async (req, res) => {
      const email = req.params.email;
      const trxid = req.params.trxid;

      try {
        const payment = await paymentCollection.find({ userEmail: email, trxId: trxid }).toArray();
        res.send(payment);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error fetching payment' });
      }
    });
    app.get('/success-payment', async (req, res) => {
      try {
        const { val_id } = req.query;

        const isValid = await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=mysha67a089e21f898&store_passwd=mysha67a089e21f898@ssl&v=1&format=json`);

        if (isValid?.data?.status !== "VALID") {
          return res.status(400).send("Payment is not valid");
        }

        const trxId = isValid?.data?.tran_id;

        await paymentCollection.updateOne({ trxId }, { $set: { paymentStatus: "success" } });
        console.log("Looking for trxId:", trxId);

        const paymentDoc = await paymentCollection.findOne({ trxId });
        if (!paymentDoc) return res.status(404).send("Transaction not found");

        const { eventId, userEmail } = paymentDoc;
        const uni = await userCollestion.findOne({ email: userEmail });
        if (!uni) return res.status(404).send("User university not found");

        await EventCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $push: { participants: { email: userEmail, university: uni.universityName } } }
        );

        res.redirect(`https://your-frontend-url.com/success-payment/${trxId}`);
      } catch (error) {
        console.error("GET /success-payment error:", error);
        res.status(500).send("Server error");
      }
    });
    app.post('/success-payment', async (req, res) => {
      try {
        const successPay = req.body;
        // console.log("Payment successful:", successPay);

        const isValid = await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${successPay.val_id}&store_id=mysha67a089e21f898&store_passwd=mysha67a089e21f898@ssl&v=1&format=json`);
        console.log("isValid", isValid)
        if (isValid?.data?.status !== "VALID") {
          return res.status(400).send({ message: "Payment is not valid" });
        }

        const trxId = isValid?.data?.tran_id;
        console.log("trxid", trxId)
        const updatePayment = await paymentCollection.updateOne(
          { trxId },
          { $set: { paymentStatus: "success" } }
        );
        console.log(updatePayment)
        const paymentDoc = await paymentCollection.findOne({ trxId });
        if (!paymentDoc) return res.status(404).send({ message: "Transaction not found" });

        const { eventId, userEmail } = paymentDoc;
        const uni = await userCollestion.findOne({ email: userEmail });
        if (!uni) return res.status(404).send({ message: "User university not found" });

        await EventCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $push: { participants: { email: userEmail, university: uni.universityName } } }
        );

        res.redirect(`http://localhost:5173/success-payment/${trxId}`);
      } catch (error) {
        console.error("Payment error:", error);
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    app.post('/favourites/:email', async (req, res) => {
      const email = req.params.email
     const club=req.body
       const existing = await favouriteCollection.findOne({
    email: email,
    club: club.clubId,
    isFavourite: club.isFav
  });
 if(existing){
   return res.send({inserted:false, message:"already exist"})
 }
      const result =await favouriteCollection.insertOne({ email:email, club: club.clubId, isFavourite: club.isFav})
      res.send(result)
 })
 app.get('/favourites', async(req,res)=>{
    const result=await favouriteCollection.find({}).toArray()
    res.send(result)
 })
    app.post('/news', async (req, res) => {
      const news = req.body;
      const isExist = await newsCollection.findOne({ title: news.title });
      if (isExist) {
        console.log('NEWS ALREADY EXIST');
        res.send({ message: 'NEWS ALREADY EXIST' });
      } else {
        const result = await newsCollection.insertOne(news);
        res.send(result);
      }
    })
    app.get('/news', async (req, res) => {
      const result = await newsCollection.find().toArray();
      res.send(result);
    })
    // 
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
// module.exports = serverless(app);