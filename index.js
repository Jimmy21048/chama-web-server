const express = require('express')
const cors = require('cors')
const connection = require('./dbConfig')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json());


app.post('/addUser', (req, res) => {
    const data = req.body

    const thisWeek = Math.ceil(data.todayNumber / 7)
    const thisRound = Math.ceil(data.todayNumber / 30)

    const query = "INSERT INTO chama (username, week, month, extra) VALUES (?, ?, ?, ?)";
    const values = [req.body.username, thisWeek, thisRound, thisWeek * -150]

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
            return res.json({fail: "AN ERROR OCCURRED"})
        }

        return res.json({success: result})
    })
})
app.get('/getUser/:username', (req, res) => {
    const { username } = req.params
    const query = "SELECT * FROM chama WHERE username = ? AND verified = ?";
    const values = [username, 0]
 
    connection.query(query, values, (err, result) => {
        if(err) {
            console.log(err)
            return res.json({fail: "SORRY, AN ERROR OCCURRED"})
        } 

        if(result.length > 0) {
            return res.json({success: result})
        } else {
            return res.json({fail: "INVALID CREDENTIALS"})
        }
        
    })
})
app.post('/verifyUser', (req, res) => {
    const query = "UPDATE chama SET pwd = ?, verified = ? WHERE username = ?";
    const values = [req.body.password, 1, req.body.username]

    connection.query(query, values, (err) => {
        if(err) {
            console.log(err)
            return res.json({fail: "SORRY, AN ERROR OCCURRED"})
        }

        return res.json({success: true})
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
    //get user details first
    const query = "SELECT once, weekly, week, monthly, month, extra, total, round FROM chama WHERE username = ?"
    const values = [data.username]

    connection.query(query, values, (err, result) => {
        if(err) {
            console.log(err)
            return res.json({fail: "Could not complete operation"})
        }
       const userDetails = result[0] 

       //check for the week and month number
       const week = userDetails.week
       const month = userDetails.month
       const weekly = userDetails.weekly
       const thisWeek = Math.ceil(data.todayNumber / 7)
       const thisRound = Math.ceil(data.todayNumber / data.roundDays)
       const tableWeek = thisWeek - week
       const tableRound = thisRound - month

       const query1 = "UPDATE chama SET weekly = weekly + ?, week = ?, monthly = monthly + ?, month = ?, extra = extra + ?, total = total + ?, metaData = ? WHERE username = ?"
       const values1 = [
            Number(data.amount),
            thisWeek,
            Number(data.amount),
            thisRound,
            Number(data.amount),
            Number(data.amount),
            data.metaData,
            data.username
       ]

       connection.query(query1, values1, (err1) => {
            if(err1) {
                console.log(err1)
                return res.json({fail: "Could not complete operation"})
            }
            return res.json({success: 'updated'})
       })

    })
})

app.post('/updateUsers', (req, res) => {
    const data = req.body.notUpdated
    const weekQuery = "UPDATE chama SET weekly = ?, week = ?, extra = extra - ? WHERE username = ?"
    const monthQuery = "UPDATE chama SET weekly = ?, week = ?, extra = extra - ?, monthly = ?, month = ? WHERE username = ?"

    connection.beginTransaction((err) => {
        if(err) {
            console.log("Transaction error")
            return res.json({fail: 'Could not complete operation'})
        }

        const promises = data.map(item => {
            return new Promise((resolve, reject) => {
                if(item.monthDiff > 0) { 
                    connection.query(monthQuery, [0, item.thisWeek, (item.weekDiff * 150), 0, item.thisRound, item.username], (err1) => {
                        if(err1) {
                            reject(err1)
                        } else {
                            resolve()
                        }
                    })
                } else {
                    connection.query(weekQuery, [0, item.thisWeek, (item.weekDiff * 150), item.username], (err1) => {
                        if(err1) {
                            reject(err1)
                        } else {
                            resolve()
                        }
                    })
                }
            })
        })

        Promise.all(promises)
        .then(() => {
            connection.commit((err1) => {
                if(err1) {
                    console.log("Transaction commit failed ", err1)
                    connection.rollback(() => console.log("Transaction rolled back"))
                    return res.json({fail: "Something went wrong"})
                } else {
                    return res.json({success: "success"})
                }
            })
        }).catch((err1) => {
            console.log("Transaction failed ", err1)
            connection.rollback(() => console.log("Transaction rolled back"))
            return res.json({fail: "Something went wrong"})
        })
    })
})

app.post('/updateRounds', async (req, res) => {
    const data = req.body.users
    const query = "UPDATE chama SET round = ? WHERE username = ?";

    connection.beginTransaction((err => {
        if(err) {
            return console.log("Bulk transaction failed "+ err)
        }

        const promises = data.map(item => {
            return new Promise((resolve, reject) => {
                connection.query(query, [item.round, item.username], (err1) => {
                    if(err1) {
                        reject(err1)
                    } else {
                        resolve()
                    }
                })
            })
        })

        Promise.all(promises)
        .then(() => {
            connection.commit((err2) => {
                if(err2) {
                    console.error("Commit failed "+ err2)
                    connection.rollback(() => console.log("Transaction rolled back"))
                    return res.json({fail: "Rounds not Updated"})
                } else {
                    return res.json({success: "Rounds Updated"})
                }
            })
        }).catch((err3) => {
            console.error("Commit failed "+ err3)
            connection.rollback(() => console.log("Transaction rolled back"))
            return res.json({fail: "Rounds not Updated"})
        })
    }))
})
app.get('/getRoundDetails', (req, res) => {
    const query = "SELECT round_days, start_date FROM admin"

    connection.query(query, (err, result) => {
        if(err) {
            console.log(err)
            return res.json({fail: "Failed"})
        }
        return res.json({success: result})
    })
})
app.post('/changeRoundDetails', (req, res) => {
    const data = req.body.rounds
    const days = Number(data.days)
    const query = "UPDATE admin SET round_days = ?, start_date = ? WHERE username = ?";
    const values = [days, data.date, 'admin']

    connection.query(query, values, (err) => {
        if(err) {
            console.log(err)
            return res.json({fail: 'failed'})
        }
        return res.json({success: 'records updated'})
    })
})

connection.connect((err) => {
    if(err) return console.log(err);
    app.listen(3000, (err) => {
        if(err) return console.log(err);
    
        console.log("Server up and running")
    })
})
