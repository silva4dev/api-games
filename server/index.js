const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const JWTSecret = "djkshahjksdajksdhasjkdhasjkdhasjkdhasjkd";

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


function auth(req, res, next){
    const authToken = req.headers['authorization'];
    if(authToken != undefined){
        const bearer = authToken.split(' ');
        const token = bearer[1];
        jwt.verify(token,JWTSecret,(err, data) => {
            if(err){
                res.status(401);
                res.json({err:"Token inválido!"});
            }else{
                req.token = token;
                req.loggedUser = {id: data.id,email: data.email};         
                next();
            }
        });
    }else{
        res.status(401);
        res.json({err:"Token inválido!"});
    } 
}

const DB = {
    games: [
        {
            id: 1,
            title: "Call of duty MW",
            year: 2019,
            price: 60
        },
        {
            id: 2,
            title: "Sea of thieves",
            year: 2018,
            price: 40
        },
        {
            id: 3,
            title: "Minecraft",
            year: 2012,
            price: 20
        }
    ],
    users: [
        {
            id: 1,
            name: "Rodrigo",
            email: "rodrigo232@gmail.com",
            password: "123456"
        },
        {
            id: 2,
            name: "Guilherme",
            email: "gui521@yahoo.com",
            password: "123456"
        }
    ]
}

app.get("/games",auth,(req, res) => {

    const HATEOAS = [ 
        {
            href: "http://localhost:5001/games/0",
            method: "DELETE",
            rel: "delete_game" // descrição
        },
        {
            href: "http://localhost:5001/games/0",
            method: "GET",
            rel: "get_game"
        },
        {
            href: "http://localhost:5001/games/0",
            method: "PUT",
            rel: "edit_game"
        },
        {
            href: "http://localhost:5001/auth",
            method: "POST",
            rel: "login"
        }
    ];

    res.statusCode = 200;
    res.json({games: DB.games, _links: HATEOAS});
});

app.get("/games/:id",auth,(req, res) => {

    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        const id = parseInt(req.params.id);
        
        const HATEOAS = [ 
            {
                href: "http://localhost:5001/games/" + id,
                method: "DELETE",
                rel: "delete_game" // descrição
            },
            {
                href: "http://localhost:5001/games/" + id,
                method: "PUT",
                rel: "edit_game" // descrição
            },
            {
                href: "http://localhost:5001/games/" + id,
                method: "GET",
                rel: "get_game"
            },
            {
                href: "http://localhost:5001/games",
                method: "GET",
                rel: "get_all_games"
            }
        ];

        const game = DB.games.find(g => g.id == id);
        if(game != undefined){
            res.statusCode = 200;
            res.json({game, _links: HATEOAS});
        }else{
            res.sendStatus(404);
        }
    }
});

app.post("/games",auth,(req, res) => { 
    const {title, price, year} = req.body;
    DB.games.push({
        id: Math.round(Math.random() * 100),
        title,
        price,
        year
    });
    res.sendStatus(200);
})

app.delete("/games/:id",auth,(req, res) => {
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        const id = parseInt(req.params.id);
        const index = DB.games.findIndex(g => g.id == id);

        if(index == -1){
            res.sendStatus(404);
        }else{
            DB.games.splice(index,1);
            res.sendStatus(200);
        }
    }
});

app.put("/games/:id",(req, res) => {
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        const id = parseInt(req.params.id);
        const game = DB.games.find(g => g.id == id);
        if(game != undefined){
            const {title, price, year} = req.body;
            if(title != undefined){
                game.title = title;
            }
            if(price != undefined){
                game.price = price;
            }
            if(year != undefined){
                game.year = year;
            }
            res.sendStatus(200);
        }else{
            res.sendStatus(404);
        }
    }
});


app.post("/auth",(req, res) => {
    const {email, password} = req.body;
    if(email != undefined){
        const user = DB.users.find(u => u.email == email);
        if(user != undefined){
            if(user.password == password){
                jwt.sign({id: user.id, email: user.email},JWTSecret,{expiresIn:'48h'},(err, token) => {
                    if(err){
                        res.status(400);
                        res.json({err:"Falha interna"});
                    }else{
                        res.status(200);
                        res.json({token: token});
                    }
                })
            }else{
                res.status(401);
                res.json({err: "Credenciais inválidas!"});
            }
        }else{
            res.status(404);
            res.json({err: "O E-mail enviado não existe na base de dados!"});
        }

    }else{
        res.status(400);
        res.send({err: "O E-mail enviado é inválido"});
    }
});

app.listen(5001,() => {
    console.log("API RODANDO!");
});