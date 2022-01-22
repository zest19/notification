const express = require('express')
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

const admin = require('firebase-admin')
const { google } = require('googleapis')
const axios = require('axios')

const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const SCOPES = [MESSAGING_SCOPE]

const serviceAccount = require('./newharty-3dc30-firebase-adminsdk-p73fl-86aa461081.json')
const databaseURL = 'https://newharty-3dc30.firebaseio.com'
const URL =
'https://fcm.googleapis.com/v1/projects/newharty-3dc30/messages:send'
 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
})

// send noti to device by token
app.get('/sendnoti/:token/:title/:body', (req, res) => {
    const deviceToken = req.params.token;
    const title = req.params.title;
    const body = req.params.body;
    let result = init(deviceToken, title, body);
    return res.send({ 
        error: false, 
        data:[{
            'deviceToken':deviceToken, 
            'title':title,
            'body':body
        }], 
    })
})

function getAccessToken() {
    return new Promise(function(resolve, reject) {
        var key = serviceAccount
        var jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        )
        jwtClient.authorize(function(err, tokens) {
        if (err) {
            reject(err)
            return
        }
        resolve(tokens.access_token)
        })
    })
}

async function init(deviceToken, title, message) {
    const body = {
        message: {
        data: { key: 'value' },
        notification: {
            title: title,
            body: message
        },
        webpush: {
            headers: {
            Urgency: 'high'
            },
            notification: {
            requireInteraction: 'true'
            }
        },
        token: deviceToken
        }
    }
    
    try {
        const accessToken = await getAccessToken()
        console.log('accessToken: ', accessToken)
        const { data } = await axios.post(URL, JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
        })
        console.log('name: ', data.name)
        return data.name;
    } catch (err) {
        console.log('err: ', err.message)
        return err.message;

    }
}


app.listen(process.env.PORT);

// init()