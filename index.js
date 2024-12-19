require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fdepx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplicationCollection = client
      .db('jobPortal')
      .collection('job_applications');

    // jobs related apis
    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }

      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post('/jobs', async (res, req) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // Auth related APIs
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, 'secret', { expiresIn: '1h' });
      res.send(token);
    });

    // Job applicatin apis
    app.get('/job-application', async (req, res) => {
      const email = req.query.email;
      const query = { application_email: email };
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);

      // fokira way to aggregate data
      for (const application of result) {
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
        }
      }
    });

    // get a specific job application by id
    app.get('/job-applications/jobs/:job_id', async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/job-applications', async (req, res) => {
      const applicatin = req.body;
      const result = await jobApplicationCollection.insertOne(applicatin);
      res.send(result);
    });

    // update
    app.patch(`/job-applications/:id`, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Job is falling from the sky');
});

app.listen(port, () => {
  console.log(`Job is waiting at: ${port}`);
});
