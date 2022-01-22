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
app.post('/sendnoti', (req, res) => {

    let result = init(req.body);
    return res.send({ 
        error: false, 
        data:[{
            'data':req.body
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

async function init(data) {
    let chatuserid = null;
    if (typeof data.chatuserid !== 'undefined') {
        chatuserid = data.chatuserid;
    }
    const body = {
        message: {
        data: { key: 'value' },
        notification: {
            title: data.title,
            body: data.body
        },
        webpush: {
            headers: {
            Urgency: 'high'
            },
            notification: {
            requireInteraction: 'true'
            }
        },
        data: {
            menu: data.menu,
            chatuserid:chatuserid,
        },
        token: data.token
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