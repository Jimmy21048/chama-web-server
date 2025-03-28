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
        if(err) {
            console.log(err)
            return res.json({fail: "Failed"})
        }

        return res.json({success: result})
    })
})
app.post('/getUser', (req, res) => {
    const query = "SELECT * FROM chama WHERE username = ? AND verified = ?";
    const values = [req.body.username, 0]

    connection.query(query, values, (err, result) => {
        if(err) return console.log(err);

        if(result.length > 0) {
            return res.json({success: result})
        } else {
            return res.json({fail: []})
        }
        
    })
})
app.post('/verifyUser', (req, res) => {
    const query = "UPDATE chama SET pwd = ?, verified = ? WHERE username = ?";
    const values = [req.body.password, 1, req.body.username]

    connection.query(query, values, (err) => {
        if(err) {
            console.log(err)
            return res.json({fail: true})
        }

        return res.json({added: true})
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
app.post('/updateAmount', (req, res) => {
    const data = req.body
    const query = "UPDATE chama SET weekly = ?, total = total + weekly, metaData = ? WHERE username = ?";
    const values = [data.amount, data.metaData, data.username]

    connection.query(query, values, (err) => {
        if(err) {
            console.log(err)
            return res.json({fail: "Could not complete operation"})
        }

        return res.json({success: "Amount Updated"});
    })
})

app.post('/updateRounds', async (req, res) => {
    const data = req.body.users
    const query = "UPDATE chama SET round = ? WHERE username = ?";

    for(let i = 0; i < data.length; i++) {
        const values = [data[i].round, data[i].username]

        connection.query(query, values, (err) => {
            if(err) {
                console.log(err)
                return res.json({fail: "Could not update all rounds"})
            }
            
        })
    }

    return res.json({success: "Rounds Updated"})
})

connection.connect((err) => {
    if(err) return console.log(err);
    app.listen(3000, (err) => {
        if(err) return console.log(err);
    
        console.log("Server up and running")
    })
})
