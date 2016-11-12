var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);

// Database connection details;
var cn = {
    host: 'dad-postgres.clcyrikoceop.us-west-2.rds.amazonaws.com', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'dateadog',
    user: 'dadadmin',
    password: 'zOg8sUs87TOu',
    poolSize: 25
};
var db = pgp(cn);

// add query functions
function getNextDogs(req, res, next) {
  // dog_id, breeds, age, shelter_id, image_url, description, dog_name, sex, status
  // var query = 'SELECT d.dog_id, d.dog_name, d.age, d.sex, d.size, di.image_url, s.shelter_name \
  var query = 'SELECT d.dog_id, d.breeds, d.age, s.shelter_name, di.image_url, d.description, d.dog_name, d.sex, d.status \
               FROM Dogs d \
               JOIN DogImages di ON d.dog_id = di.dog_id \
               JOIN Shelters s ON d.shelter_id = s.shelter_id \
               WHERE NOT EXISTS (SELECT vd.dog_id \
                 FROM ViewedDogs vd \
                 WHERE vd.user_id = $1 \
                 AND d.dog_id = vd.dog_id) \
               AND di.image_id = 1 \
               AND di.image_size = $2 \
               ORDER BY d.dog_id ASC \
               LIMIT $3';
  db.any(query, [2, 'pn', 3])
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'retrieved next doggies'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

// add query functions
function judgeDog(req, res, next) {
  var query = 'INSERT INTO ViewedDogs (user_id, dog_id, liked) \
                 VALUES ($1, $2, $3)';
  db.none(query, req.user.id, req.body.dog_id, req.body.liked)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'judged dog ' + req.body.dog_id
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createUser(req, res, next) {
  var query = 'INSERT INTO Users (email, full_name) \
               VALUES ($1, $2)';
  db.none(query, [req.user.email, req.user.name])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'created user ' + req.user.name
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getDateRequestDetail(req, res, next) {
  var query = 'SELECT r.dog_id, r.user_id, r.requested_date, r.status, \
                      d.dog_name, u.email, u.full_name, u.street, u.city, \
                      u.state, u.zipcode, u.phone \
               FROM Request r \
                 JOIN Users u ON r.user_id = u.user_id \
                 JOIN Dogs d ON r.dog_id = d.dog_id \
               WHERE r.req_id = $1';
  db.one(query, [req.body.request_id])
    .then(function (data) {
    res.status(200)
      .json({
        status: 'success',
        data: data,
        message: 'retrieved request details for request  ' + req.body.request_id
      });
    })
    .catch(function (err) {
      return next(err);
    });
}

// add query functions
function getDogSummary(req, res, next) {
    var query = 'SELECT d.dog_id, d.dog_name, d.age, d.sex, d.size, di.image_url, s.shelter_name \
    FROM Dogs d \
    JOIN DogImages di ON d.dog_id = di.dog_id \
    JOIN Shelters s ON d.shelter_id = s.shelter_id \
    WHERE d.dog_id = $1 \
    AND di.image_id = $2 \
    AND di.image_size = $3 \
    LIMIT $4';
    db.one(query, [req.body.dog_id, 1, 'pn', 1])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Dog Summary'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getDogDetail(req, res, next) {
    var query = 'SELECT d.dog_id, d.dog_name, d.age, d.sex, d.size, d.breeds, d.description, \
                di.image_url, s.shelter_name, s.shelter_id \
                FROM Dogs d \
                JOIN DogImages di ON d.dog_id = di.dog_id \
                JOIN Shelters s ON d.shelter_id = s.shelter_id \
                WHERE d.dog_id = $1 \
                AND di.image_id = $2 \
                AND di.image_size = $3 \
                LIMIT $4';
    db.one(query, [req.body.dog_id, 1, 'pn', 1])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Dog Detail'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getLikedDogs(req, res, next) {
    var query = 'SELECT d.dog_id, d.dog_name, di.image_url \
    FROM ViewedDogs vd \
    JOIN Dogs d ON vd.dog_id = d.dog_id \
    JOIN DogImages di ON vd.dog_id = di.dog_id \
    WHERE vd.user_id = $1 \
    AND vd.liked = $2 \
    AND di.image_id = $3 \
    AND di.image_size = $4 \
    ORDER BY vd.liked_time DESC';

    db.any(query, [req.user.id, 'TRUE', 1, 'fpm'])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Liked Dog List'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function makeDateRequest(req, res, next) {
    var query = 'INSERT INTO Request (dog_id, shelter_id, user_id, status, requested_date) \
    VALUES ($1, $2, $3, $4, $5)';

    db.none(query, [req.body.dog_id, req.body.shelter_id, req.user.id, 'A', req.body.date])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Added Date Request'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function updateUserApplication(req, res, next) {
    var query = 'UPDATE Users \
    SET full_name = $1, \
        street = $2, \
        city = $3, \
        state = $4, \
        zipcode = $5, \
        phone = $6 \
    WHERE user_id = $7';

    db.none(query, [req.body.full_name, req.body.street, req.body.city, req.body.state,
        req.body.zipcode, req.body.phone, req.user.id])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Added Date Request'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getUnreviewedRequestList(req, res, next) {
    var query = 'SELECT r.req_id, r.dog_id, r.user_id, r.requested_date, \
    u.full_name, d.dog_name \
    FROM Request r \
    JOIN Users u ON r.user_id = u.user_id \
    JOIN Dogs d ON r.dog_id = d.dog_id \
    WHERE r.shelter_id = $1 \
    AND r.status = $2 \
    ORDER BY r.requested_date ASC';

    db.any(query, [req.body.shelter_id, ''])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Unreviewed Date Request List'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getHugosRequest(req, res, next) {
  var query = 'SELECT r.req_id AS id, r.request_time AS dateTime, \
               r.status AS status, json_build_object(\'name\', u.full_name, \
               \'email\', u.email, \'phone\', u.phone, \'address\', \
               json_build_object(\'street\', u.street, \'city\', u.city, \
               \'state\', u.state, \'zipcode\', u.zipcode)) AS daterProfile, \
               json_build_object(\'id\', r.dog_id, \'name\', d.dog_name, \
               \'sex\', d.sex) AS dogProfile FROM Request r JOIN Users u ON \
               r.user_id = u.user_id JOIN Dogs d ON r.dog_id = d.dog_id WHERE \
               r.shelter_id = $1 ORDER BY r.requested_date ASC;'
   db.any(query, [req.body.shelter_id])
     .then(function (data) {
       res.status(200)
       .json({ status: 'success',
               data: data,
               message: 'Retrieved Unreviewed Date Request List'
             });
       })
       .catch(function (err) {
         return next(err);
       });
}

function getReviewedDateHistory(req, res, next) {
    var query = 'SELECT r.req_id, r.dog_id, r.user_id, r.requested_date, r.status, \
        u.full_name, d.dog_name \
    FROM Request r \
    JOIN Users u ON r.user_id = u.user_id \
    JOIN Dogs d ON r.dog_id = d.dog_id \
    WHERE r.shelter_id = $1 \
    AND r.status != $2 \
    ORDER BY r.updated_time ASC';

    db.any(query, [req.body.shelter_id, req.body.status])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved Reviewed Date Request List'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function updateDateRequestStatus(req, res, next) {
    var query = 'UPDATE Request \
    SET status = $1, \
    updated_time = CURRENT_TIMESTAMP \
    WHERE req_id = $2';

    db.none(query, [req.body.status, req.body.req_id])
        .then(function () {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated Date Request Status'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

module.exports = {
  // Rest API specific queries
  getNextDogs: getNextDogs,
  judgeDog: judgeDog,
  createUser: createUser,
  getDateRequestDetail: getDateRequestDetail,
  getDogSummary: getDogSummary,
  getDogDetail: getDogDetail,
  getLikedDogs: getLikedDogs,
  makeDateRequest: makeDateRequest,
  updateUserApplication: updateUserApplication,
  getUnreviewedRequestList: getUnreviewedRequestList,
  getReviewedDateHistory: getReviewedDateHistory,
  updateDateRequestStatus: updateDateRequestStatus,
  getHugosRequest: getHugosRequest
};