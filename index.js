const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')

// server config
app.use(cors())

// serve html
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// options
const PARSER = bodyParser.urlencoded({ extended: false })

// database
class Db {
  constructor() {
    this.data = []
  }
  addUser(newUser) {
    this.data.push(newUser)
  }
  addExerciseToUser(_id, exercise) {
    if(this.data.length !== 0) {
      // find db entry
      for(let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
        if(this.data[dbIndex]._id === _id) {
          this.data[dbIndex].log.push(exercise)
          console.log(`New Exercise added: ${JSON.stringify(this.data[dbIndex])}`)
        }
      }
    }
  }
  getUser(_id) {
    if (this.data.length !== 0) {
      // find db entry
      for (let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
        if (this.data[dbIndex]._id === _id) {
          console.log(`Found User Obj: ${JSON.stringify(this.data[dbIndex])}`)
          return this.data[dbIndex]
        }
      }
    }
  }
}

const DB = new Db

// User Class
class User {
  constructor(username) {
    this.username = username
    this._id = this.createNewUserId()

    this.log = []
  }

  createNewUserId() {
    // if database is empty => return _id = 1
    if (DB.data.length === 0) {
      return '1'
    }
    // if database is not empty => search for new _id
    else {
      // try out different _id values
      let foundNew_id = false
      for (let new_id = 1; new_id <= DB.data.length + 1; new_id++) {
        console.log("db length: ", DB.data.length)
        console.log(`Check new ID: ${new_id}`)
        // check each database entry for new _id
        for (let dbIndex = 0; dbIndex < DB.data.length; dbIndex++) {
          // new _id already exists in database => try again with new _id value
          if (Number(DB.data[dbIndex]._id) === new_id) {
            foundNew_id = false
            break;
          }
          // new _id doesnt exist in database => indicate result
          else {
            foundNew_id = true
          }
        }
        // if new _id is found => return new _id
        if (foundNew_id) {
          return new_id.toString()
        }
      }
    }
  }
}

// Exercise Class
class Exercise {
  constructor(description, duration, date) {
    this.description = description
    this.duration = Number(duration)
    // check if date is valid
    date = new Date(date)
    const DATE_IS_VALID = (date instanceof Date && !isNaN(date.valueOf()))
    if(DATE_IS_VALID) {
      this.date = date.toDateString()
    } else {
      this.date = (new Date()).toDateString()
    }
  }
}


// user creation API endpoint
app.post('/api/users', PARSER, function (req, res) {
  // Extract form data
  const USER_NAME = req.body.username
  // create new User object
  const USER = new User(USER_NAME)
  // add User to database
  DB.addUser(USER)
  res.json({
    username: USER.username,
    _id: USER._id
  })
  console.log('NEW DB entry: ', DB)
})

// user list API endpoint
app.get('/api/users', function (req, res) {
  res.json(DB.data)
})

// user exercise log API endpoint
app.get('/api/users/:_id/logs', function (req, res) {
  // Extract data
  console.log(req.params)
  const SUBMITTED_ID = req.params._id
  // get User Obj
  const USER = DB.getUser(SUBMITTED_ID)
  const EXERCISE_COUNTER = USER.log.length
  res.json({
    _id: USER._id,
    username: USER.username,
    count: EXERCISE_COUNTER,
    log: USER.log,
  })
})

// submit exercise API endpoint
app.post('/api/users/:_id/exercises', PARSER, function(req, res) {
  // Extract data
  const SUBMITTED_EXERCISE = req.body
  const USER_ID = req.params._id
  // create new Exercise Obj
  const EXERCISE = new Exercise(SUBMITTED_EXERCISE.description, SUBMITTED_EXERCISE.duration, SUBMITTED_EXERCISE.date)
  // add exercise to database
  DB.addExerciseToUser(USER_ID, EXERCISE)
  // send response
  const NEW_USER_OBJ = DB.getUser(USER_ID)
  res.json({
    _id: NEW_USER_OBJ._id,
    username: NEW_USER_OBJ.username,
    date: EXERCISE.date,
    duration: EXERCISE.duration,
    description: EXERCISE.description 
  })
})


const listener = app.listen(process.env.port || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
