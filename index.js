const express = require('express')
const cors = require('cors')
const connection = require('./dbConfig')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json());

app.post('/addUser', (req, res) => {
    const query = "INSERT INTO chama (username) VALUES (?)";
    const values = [req.body.username]

    connection.query(query, values, (err) => {
        if(err) return console.log(err);

        return res.json({added: true})
    })
})

app.get('/getUsers', (req, res) => {
    const query = "SELECT * FROM chama";

    connection.query(query, (err, result) => {
        if(err) return console.log(err);

        console.log(result)
    })
})
app.post('/userExists', (req, res) => {
    const query = "SELECT username FROM chama WHERE username = ?";
    const values = [req.body.username]

    connection.query(query, values, (err, result) => {
        if(err) return console.log(err);

        if(result.length > 0) return res.json({exists: true});
        return res.json({exists: false})
    })
})

connection.connect((err) => {
    if(err) return console.log(err);
    app.listen(3000, (err) => {
        if(err) return console.log(err);
    
        console.log("Server up and running")
    })
})
