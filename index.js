const express = require('express')
const app = express()
const cors = require('cors')
const axios = require('axios');
const port = process.env.PORT || 5000;
const qs = require('qs');

require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { isValidElement } = require('react');

app.use(cors());
app.use(express.json())
app.use(express.urlencoded());
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
    const participantCollection = uniEventDB.collection('participants');
    const paymentCollection = uniEventDB.collection('payments');
    const wishlistCollection = uniEventDB.collection('wishlists');
    const newsCollection = uniEventDB.collection('news');
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
  const query = req.query;
  console.log("query:", query);

  let allEvents = [];

  try {
    allEvents = await EventCollection.find({}).toArray(); // ensure plain object
  } catch (err) {
    return res.status(500).send({ error: "Failed to fetch events" });
  }

  let filtered = [];
  const now = new Date();
  if (!query.query || query.query === 'all') {
    return res.send(allEvents);
  }
  if (query.query === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    filtered = allEvents.filter(e => {
      const d = new Date(e.eventDate);
      return d >= start && d <= end;
    });

  } else if (query.query === 'week') {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 7);

    filtered = allEvents.filter(e => {
      const d = new Date(e.eventDate);
      return d >= start && d <= end;
    });

  } else if (query.query === 'month') {
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
    app.post('/wishlist/:email', async (req, res) => {
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
    //     Store ID: mysha67a089e21f898
    // Store Password (API/Secret Key): mysha67a089e21f898@ssl
    app.post('/create-ssl-payment', async (req, res) => {
      const payment = req.body;
      // console.log(payment, "payment")
      const trxid = new ObjectId().toString();
      payment.trxId = trxid;
      const initiate = {
        store_id: "mysha67a089e21f898",
        store_passwd: "mysha67a089e21f898@ssl",
        currency: "BDT",
        total_amount: `${payment.paymentAmount}`,
        tran_id: trxid,
        success_url: "http://localhost:5000/success-payment",
        fail_url: "http://localhost:5000/fail",
        cancel_url: "http://localhost:5000/cancel",
        ipn_url: "http://localhost:5000/ipn-success-payment",
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

      const amount = await paymentCollection.insertOne(payment);
      res.send({ paymentUrl })
      // console.log(paymentUrl, "paymentUrl")
      // console.log("SSLCommerz response:", response.data);
    })


    app.post('/success-payment', async (req, res) => {
      const successPay = req.body;
      // console.log("Payment successful:", successPay);
const isValid=await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${successPay.val_id}&store_id=mysha67a089e21f898&store_passwd=mysha67a089e21f898@ssl&v=1&format=json`);
    console.log(isValid,"isValid")
    if(isValid?.data?.status!="VALID"){
      res.send({message:"Payment is not valid"})
    }
    //update
    else{
      const updatePayment = await paymentCollection.updateOne({trxId:isValid?.data?.tran_id},
        {
          $set:{
            paymentStatus:"success"
          }
        })
        res.redirect('http://localhost:5173/success-payment');
        console.log(updatePayment,"updatePayment")
    }
    })
    app.post('/news', async (req, res) => {
      const news = req.body;
      const isExist = await newsCollection.findOne({ title: news.title });
      if (isExist) {
        console.log('NEWS ALREADY EXIST');
        res.send({ message: 'NEWS ALREADY EXIST' });
      } else{
        const result = await newsCollection.insertOne(news);
        res.send(result);
      }})
          app.get('/news', async (req, res) => {
            const result =await newsCollection.find().toArray();
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