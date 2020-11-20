/*

Written by su-Greg for EES project

*/

// Requirements
const fs = require('fs');
//var http = require('http');
var bodyParser = require("body-parser");
var session = require('express-session');
//const { parse } = require('querystring');

var title = "DNO Network"; 	// Page title
const port = 8080;			// Port

// Parse json data 
var json = require("./data.json");

json.last = new Date;

// Express and co.
const express = require('express');
var app = express();

var date = new Date();
console.log(`EES is up at: ${date}`);


// Authentications
app.use(session({ resave: true, secret: '133742069', saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Login and auth handler //
{
    // Function to check user ids
    function checkAuth(req, res, next) {
        if (!req.session.user_id) {
            res.redirect("/login");
            console.log(" [!] Unauthorized post request made to: " + req.originalUrl);
        } else {
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            next();
        }
    }

    // Login post handler
    app.post('/login', function (req, res) {
        var post = req.body;
        if (post.user === 'admin' && post.password === 'toor') {
            console.log("[+] User Logged in as: " + post.user);
            req.session.user_id = 3;
            res.redirect("/");
        } else {
            res.send('Bad user/pass');
            console.log(" [~] Failed Login with Uname: " + post.user + "  Pwd: " + post.password);
        }
    });

    // Login Page
    app.get('/login', function (req, res) {
        res.render('login');
        console.log("[+] Served Login Page");
    });
    app.get('/logout', function (req, res) {
        delete req.session.user_id;
        console.log("[+] User logged out");
        res.redirect('/login');
    });
}

// Homepage
app.get('/', checkAuth, function (req, res) {
    res.render('index', json);
    console.log("[+] Served Home Page");
});
// Map Page
app.get('/map', checkAuth, function (req, res) {
    res.render('map', json);
    console.log("[+] Served map Page");
});
// Manage Page
app.get('/manage', checkAuth, function (req, res) {
    res.render('manage', json);
    console.log("[+] Served manage Page");
});
    


// Posts to bases
app.post("/bases", checkAuth, function (req, res) {
    console.log(req.body);
    json.bases.forEach(element => { 
        for (var prop in req.body) {
            if (element.ip == prop) {
                element.name = req.body[prop];
            }
        }
    });
    res.redirect("/");
});

// Posts to maps
app.post("/maps", checkAuth, function(req,res){
    console.log(req.body);
    json.bases.forEach(element => { 
        for (var prop in req.body) {
            try {
                if (element.ip == prop && req.body[prop].split(",").length == 2) {
                    element.lat = parseFloat(req.body[prop].split(",")[0]);
                    element.lng = parseFloat(req.body[prop].split(",")[1]);
                }
            } catch (err) {
                   res.end("Invalid co-ordinates");
            }
        }
            
    });
    res.redirect("/map");
});


// Receive incoming POSTs from arduinos
app.post("/", function(req,res){
    console.log(req.body);
    if (req.body.ip != undefined && req.body.down != undefined && Object.keys(req.body).length == 2) {
        var exists = false;
        var down = 0;
        json.bases.forEach(base => { 
            for (var prop in req.body) {
                if (base.ip == req.body.ip) {
	        	    exists = true;
                    base.last = (new Date).getTime();
                    base.down = req.body.down;
                }
                if (base.down.length != 0) {
                    down++;
                }
            }
        });
        if (!exists && (req.body.ip.split(".").length) == 4) { 
            json.bases.push( { "ip": req.body.ip,
                        "name" : "untitled",
                        "lat" : "53.929",
                        "lng" : "-1.114",
                        "last": (new Date).getTime(),
                        "down": req.body.down
                        } );
        }
        console.log(json);
        json.last = new Date;
        json.down = down;

        res.redirect("/");
    } else {
        res.end("Invalid data");
        console.log(" [!] Invalid post data from 'node' !");
    }
});



// Serve scripts and styles
app.get("/scripts/*", function (req, res) {
    fs.readFile("."+req.url, function(err, data) {
        res.write(data);res.end();
        console.log("[+] Served Script")
      });
});

// 404 page
app.get("*", function(req, res){
    res.status(404).send("404 page not found")
    console.log("[~] 404 at " +req.url)
});


// HTTP Listener
app.listen(port, () => console.log(`mEES nodejs server running on: ${port}!`))
