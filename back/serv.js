"use strict";

const fs = require('fs');
const http = require('http');
const mysql = require('mysql');

const port = 1888;

class Db {
    constructor() {
        this.params = {
            host: "localhost",
            user: "root",
            password: "exsS51i",
            database: "darina"
        }
    }

    connect() {
        if (!this.conn) {
            this.conn = mysql.createConnection(this.params);
            this.conn.connect(function(err) {
                if (err) throw {"error" : err}
            });
        }
        return this.conn;
    }

    run(sql, handler) {
        this.connect().query(sql, handler);
    }
}

class Routing {
    constructor(err_handler) {
        this.routes = {};
        this.err_handler = err_handler;
    }

    add_route(url, func) {
        this.routes[url] = func;
    }

    async render(req, res) {
        console.log("Processing ", req.method, req.headers.host, req.url);
        if (!(req.url in this.routes)) {
            await this.err_handler(req, res, 404);
        }
        else {
            let handler = this.routes[req.url];
            if (req.method == "POST") {
                let body = '';
                req.on('data', function(data) { body += data });
                req.on('end', function() { 
                    req.parsed_data = {};
                    if (body) req.parsed_data = JSON.parse(body);
                    console.log("  Req data: ", req.parsed_data);
                    handler(req, res);
                });
            } else {
                await this.err_handler(req, res, 405);
            }
        }
    }
}

class Server {
    constructor(routing) {
        this.server = http.createServer(async (req, res) => {
            await routing.render(req, res);
        });
    }

    start() {
        this.server.listen(port, () => {
            console.log(`Server running at port ${port}`);
        });
    }
}

class WebApp {
    constructor(err_handler) {
        this.routing = new Routing(err_handler);
        this.server = new Server(this.routing);
    }

    start() {
        this.server.start();
    }

    route(...args) {
        this.routing.add_route(...args);
    }
}

class Geo {
    constructor(coordinates) {
        if (coordinates.latitude) {
            this.latitude = coordinates.latitude
        } else { throw "latitude required" }
        if (coordinates.longitude) {
            this.longitude = coordinates.longitude
        } else { throw "latitude required" }
    }

    meters_in_latitude() {
        return 111200 // Approx constant
    }
    
    meters_in_longitude() {
        // computed by latitude, should be 0 ... 111 km, approx 71km at 50N latitude
        let earth_radius = 6371000
        let latitude_radians = this.latitude * Math.PI / 180;
        let radius_at_current_latitude = Math.cos(latitude_radians) * earth_radius;
        let parallel_lethgth_at_current_latitude = 2 * Math.PI * radius_at_current_latitude;
        return radius_at_current_latitude/360;
    }

    dif(other_geo) {
        let lat = Math.abs(this.latitude - other_geo.latitude);
        let lon = Math.abs(this.longitude - other_geo.longitude);
        if (lat >= 180)  lat = 360 - lat;
        if (lon >= 180)  lon = 360 - lon;
        return {
            "latitude" : lat, 
            "longitude" : lon
        }
    }

    meters_distance(other_geo) {
        let dif = this.dif(other_geo);
        return Math.sqrt( (dif.latitude * this.meters_in_latitude()) ** 2 + (dif.longitude * this.meters_in_longitude()) ** 2 );
    }
}

function file_sender(file){
    return function(req, res) {
        fs.readFile(file, function (err, data){
            res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
            res.write(data);
            res.end();
        });
    }
}

async function on_error(req, res, code, text) {
    let errors = {
        400 : "Bad Request",
        401 : "Unauthorized",
        403 : "Forbidden",
        404 : "Not Found",
        405 : "Method Not Allowed"
    };
    if (!text) {
        text = errors[code];
    }
    if (!text) {
        code = 500;
        text = "Internal Server Error";
    }
    console.log("  ", code, text);
    res.statusCode = code;
    res.setHeader('Content-Type', 'text/html; charset=utf-8;');
    res.write(text);
    res.end();
}

function find(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let data = req.parsed_data;
    let where = [];
    if (!data) {
        on_error(req, res, 400, "Request data is absent");
        return
    }
    if (data.geo && data.radius) {
        let where_am_i;
        try { 
            where_am_i = new Geo(data.geo) 
        } catch(err) {
            console.log("  ERROR: ", err);
            res.write(JSON.stringify( {"error" : err} ));
            res.end();
            return
        }

        // select all in _square_ +- given radius (then filter dataset for circle)
        let lat_max_range = data.radius / where_am_i.meters_in_latitude(); 
        let lat_from = where_am_i.latitude - lat_max_range; 
        let lat_to = where_am_i.latitude + lat_max_range;
        let lon_max_range = data.radius / where_am_i.meters_in_longitude();
        let lon_from = where_am_i.longitude - lon_max_range;
        let lon_to = where_am_i.longitude + lon_max_range;
        where.push("shop.latitude BETWEEN " + lat_from + " AND " + lat_to + " AND shop.longitude BETWEEN " + lon_from + " AND " + lon_to);
    }
    if (data.price_to) {  
        where.push("coffee.price <= " + data.price_to);
    }
    if (data.coffee) { 
        where.push( "("+ data.coffee.map( x => "coffee_type.id = " + x ).join(" OR ") +")" )
    }
    if (data.additions) { 
        where.push( "("+ data.additions.map( x => "additions_type.id = " + x ).join(" OR ") +")" )
    }

    let db_req = "select distinct shop.* from shop \
        left join coffee on shop.id = coffee.shop \
        left join coffee_type on coffee.coffee_type = coffee_type.id \
        left join additions on shop.id = additions.shop \
        left join additions_type on additions.additions_type = additions_type.id \
            where " + where.join(" AND ") + ";";

    console.log("    DB request: ", db_req);

    if (! where.length) { return {"data" : []} }

    let db_result;
    db.run(db_req, function (err, result, fields) {
        if (err) {
            console.log("  ERROR: ", err);
            res.write(JSON.stringify( {"error" : err} ));
            res.end();
            return
        } else {
            db_result = result
            console.log("    DB result: ", db_result);
            if (data.geo && data.radius) {
                let where_am_i = new Geo(data.geo);
                db_result = db_result.filter(function(x) {
                    let caffee = new Geo({
                        latitude : x.latitude,
                        longitude : x.longitude
                    });
                    console.log("    meters_distance to ", x.id, where_am_i.meters_distance(caffee));
                    return where_am_i.meters_distance(caffee) <= data.radius;
                });
            }
            res.write(JSON.stringify( { "data": db_result } ))
            res.end();
        }
    });
}

function coffee_type(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    db.run("select * from coffee_type;", function (err, result, fields) {
        if (err) {
            res.write(JSON.stringify( {"error" : err} ))
        }
        else {
            res.write(JSON.stringify( { "data": result } ))
        }
        res.end();
    } );
}

function additions_type(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    db.run("select * from additions_type;", function (err, result, fields) {
        if (err) {
            res.write(JSON.stringify( {"error" : err} ))
        }
        else {
            res.write(JSON.stringify( { "data": result } ))
        }
        res.end();
    } );
}

var app = new WebApp(on_error);
var db = new Db();
app.route('/api/v1.0/find', find)
app.route('/api/v1.0/coffee', coffee_type)
app.route('/api/v1.0/adds', additions_type)
app.start();

