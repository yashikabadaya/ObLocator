var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var request = require('request');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var first = true;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(fileUpload());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//var url = "mongodb://localhost:27017/database";

var url = "mongodb://localhost:27017/";
var db;
MongoClient.connect(url, function(err, d) {
    if (err) throw err;
    var dbo = d.db("database");
    db = dbo;
    // var myobj = { name: "Company Inc", address: "Highway 37" };
    // dbo.collection("customers").insertOne(myobj, function(err, res) {
    //     if (err) throw err;
    //     console.log("1 document inserted");
    //     db.close();
    // });
});

app.use('/', index);
    app.use('/users', users);

    app.post('/upload', function (req, res) {

        if (!req.files)
            return res.status(400).send('No files were uploaded.');

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        var sampleFile = req.files.sampleFile;
        //console.log(sampleFile);

        //Use the mv() method to place the file somewhere on your server
        sampleFile.mv('/home/bennyhawk/Desktop/basic-yolo-keras/images/person.jpg', function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
        });

        console.log("Saved test.jpg");


//     request.post(
//         'http://127.0.0.1:7990/get_caption', {
//             form: {
//                 path: '/home/bennyhawk/Desktop/basic-yolo-keras/images/person.jpg'
//             }
//         },
//         (error, response, body) => {
//         res.json({
//         data: body
//     });
//     console.log(body);
// });


        request.post(
            'http://127.0.0.1:7990/get_caption', {
                form: {
                    path: '/home/bennyhawk/Desktop/basic-yolo-keras/images/person.jpg'
                }
            }, function (error, response, body) {
                var lll = JSON.parse(body);
                console.log("NODE SERVER RETURN VALUE");
                console.log(" ");
                console.log(body);
                console.log(lll["Non Static"]);
                console.log(" ");


                db
                    .collection('objects')
                    .updateOne({"non_static": lll["Non Static"]},
                        {$set: {"non_static": lll["Non Static"], "static": lll["Static"], "date": lll["date"]}},
                        {upsert: true})
                    .then(function () {

                        res.json({
                            success: true
                        });

                    }, function (reason) {
                        console.log("Error");
                        console.log(reason);
                        res.json({
                            success: false
                        });
                    });


            });


    });


    app.get('/getInfo', function (req, res) {
        db
            .collection('objects')
            .findOne({non_static:req.query.nonstatic})
            .then(function (users) {


                res.json({
                    reply: users.static,
                    date: users.date
                });


            });
    });

// catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

// error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    module.exports = app;

