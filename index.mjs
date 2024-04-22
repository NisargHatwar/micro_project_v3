import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {getRandStr,getCookie,readData,writeData,isConnected,doesUserExist,getSerID,checkPass,clearCookies,validateCookie} from './udf.mjs';
import { read } from 'fs';

const app = express()
const port = 3000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views",path.join(__dirname, "templates"));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get('/home', (req,res) => {
    res.render("home.ejs");
})
app.get('/signup', (req,res) => {
    res.render("signup.ejs");
})
app.get('/isUsernameAvailable/:name', async (req,res) => {
    const {name} = req.params;
    const flag = await doesUserExist(name);
    res.json(!flag);
})
app.post('/signup', async (req,res) => {
    const { suusername:uname,supassword:pass,sucfpw } = req.body;
    const flag = await doesUserExist(uname);
    const passValidations = (pass.indexOf(' ') === -1) && (pass.length>=5) && (pass.length<=15) && (pass === sucfpw);
    const unameValidations = (uname.indexOf(' ') == -1) && (!flag) && (uname.length>=5) && (uname.length<=15);
    if((passValidations) && (unameValidations)){
        const Users = await readData("username.json");
        const str = Users["last"]; //check who was the last user
        const num = parseInt(str) + 1;
        const newUser = `user_${num}` 
        
        Users["last"] = num; //update "last in username.json"
        Users[newUser] = uname; //create new user in username.json
        await writeData("username.json",Users); // save changes in username.json

        const Passwords = await readData("passwords.json"); //Read passwords.json file
        Passwords[newUser] = pass; // create password for new user
        await writeData("passwords.json",Passwords); //save changes in passwords.json

        const swControl = await readData("switchcontrol.json");
        swControl[newUser] = swControl["default"];
        await writeData("switchcontrol.json",swControl);

        const swStates = await readData("switchstates.json");
        swStates[newUser] = swStates["default"];
        await writeData("switchstates.json",swStates);

        const swNames = await readData("switchnames.json");
        swNames[newUser] = swNames["default"];
        await writeData("switchnames.json",swNames);

        res.redirect('/login');
    }
    else if(flag) {
        res.status(409).render("error.ejs", {status:409,message:"Username already taken. Use other username"})
    }
    else{
        res.status(422).render("error.ejs", {status:422,message:"Cannot process request. Form Validations aren't met"});
    }
})
app.get('/login', (req,res) => {
    res.render("login.ejs");
})
app.post('/login', async (req,res) => {
    const {lguname:uname,lgpass:upass} = req.body;
    if(await doesUserExist(uname)){
        const serID = await getSerID(uname);
        if(serID !== -1){
            if(await checkPass(serID,upass)){
                const currTime = new Date();
                const validTime = new Date(currTime.getTime() + 30*60000);
                const cookies = await readData("cookie.json");
                let ssID;
                while(true){
                    ssID = getRandStr(25);
                    if(!cookies[ssID])
                    {
                        break;
                    }
                }
                const newCookie = {
                    "serID":serID ,
                    "pass":upass, 
                    "validTime":validTime
                }
                cookies[ssID] = newCookie;
                await writeData("cookie.json", cookies);
                res.redirect(`/remote/${ssID}`);
            }
            else{
                res.status(403).render("error.ejs", {status:403,message:"Incorrect password"});
            }
        }else{
            res.status(500).render("error.ejs", {status:400, message:"Something went wrong on the server"});
        }
    }else{
        res.status(401).render("error.ejs", {status:401,message:"Cannot find user"});
    }
})
app.get('/home/:ssID',async(req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const IsConnected = await isConnected(ssID);
        res.render("homelin.ejs",{IsConnected,ssID});
    }else{
        res.redirect("/home");
    }
})
app.get('/edit/:ssID',async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const cookie = await getCookie(ssID);
        const swNames = await readData("switchnames.json");
        const names = swNames[cookie["serID"]];
        const IsConnected = await isConnected(ssID);
        const def = swNames["default"]
        res.render("edit.ejs",{ssID,IsConnected,names,def})
    }else{
        res.redirect("/home");
    }
})
app.post('/edit/:ssID',async(req,res) => {
    const {ssID} = req.params;
    const reqBody = req.body;
    const arr = [reqBody["Switch_1"],reqBody["Switch_2"],reqBody["Switch_3"],reqBody["Switch_4"],reqBody["Switch_5"]];
    let flag = true;
    for(let i = 0;i<5;i++){
        if((String(arr[i]).length<3)||(String(arr[i]).length>15))
        {
            flag = false;
            break;
        }
    }
    if(await validateCookie(ssID)){
        if(flag){
            const cookie = await getCookie(ssID);
            const swNames = await readData("switchnames.json");
            swNames[`${cookie.serID}`] = arr;
            await writeData("switchnames.json",swNames);
            res.redirect(`/remote/${ssID}`);
        }else{
            res.status(422).send("Form validations aren't met");
        }
    }else{
        res.redirect("/home")
    }
})
app.get("/remote/:ssID", async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const swNamesfile = await readData("switchnames.json");
        const swStatesfile = await readData("switchstates.json");
        const swControlfile = await readData("switchstates.json");

        const cookie = await getCookie(ssID);
        
        const IsConnected = await isConnected(ssID);
        
        const serID = cookie["serID"];
        const pass = cookie["pass"];

        const swNames = swNamesfile[serID];
        const swControl = swControlfile[serID];
        const swState = swStatesfile[serID];

        res.render("remote.ejs",{ssID,IsConnected,swNames,swControl,swState,serID,pass});
    }else{
        res.redirect("/home");
    }
})
app.post("/remote/:ssID", async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const {user,password,button,state} = req.body;
        if(await checkPass(user,password)){
            const states = await readData("switchstates.json");
            const statearr = states[user];
            statearr[parseInt(button)] = (state==true?1:0);
            states[user] = statearr;
            await writeData("switchstates.json",states);
            res.send("Received");
        }else{
            res.status(403).send("Incorrect credentials");
        }
    }
    else{
        res.status(401).send("Cannot find user");
    }
})
app.get('/profile/:ssID', async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const cookies = await readData("cookie.json");
        const IsConnected = await isConnected(ssID);
        const cookie = cookies[ssID];
        const usernames = await readData("username.json");
        const username = usernames[cookie["serID"]];
        res.render("profile.ejs",{ssID,IsConnected,cookie,username});
    }else{
        res.redirect("/home");
    }
})
app.get("/changeusername/:ssID", async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const IsConnected = await isConnected(ssID);
        res.render("changeuname.ejs",{ssID,IsConnected})
    }else{
        res.redirect("/home");
    }
})
app.post("/changeusername/:ssID", async(req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const cookie = await getCookie(ssID);
        const {new_uname,pass} = req.body;
        if(await checkPass(cookie["serID"],pass)){
            const usernames = await readData("username.json");
            usernames[cookie["serID"]] = new_uname;
            await writeData("username.json", usernames);
            res.redirect(`/profile/${ssID}`);
        }else{
            res.status(403).render("error.ejs",{status:403,message:"Incorrect credentials"});
        }
    }else{
        res.redirect("/home")
    }
})
app.get("/changepassword/:ssID", async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const IsConnected = await isConnected(ssID);
        res.render("changepass.ejs",{ssID,IsConnected})
    }else{
        res.redirect("/home");
    }
})
app.post("/changepassword/:ssID", async(req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const {oldpass, newpass,renewpass} = req.body;
        const cookie = await getCookie(ssID);
        if(await checkPass(cookie["serID"],oldpass)){
            console.log(req.body)
            const flag = (newpass === renewpass) && (newpass.length >= 5) && (newpass.length <= 15)
            if(flag){
                const passwords = await readData("passwords.json");
                passwords[cookie["serID"]] = newpass;
                await writeData("passwords.json",passwords);
                cookie["pass"] = newpass;
                const cookies = await readData("cookie.json");
                cookies[ssID] = cookie;
                await writeData("cookie.json",cookies)
                res.redirect(`/profile/${ssID}`)
            }else{
                res.status(422).render("error.ejs", {status:422,message:"Cannot process request. Form Validations aren't met"});
            }
        }else{
            res.status(403).render("error.ejs",{status:403,message:"Incorrect credentials"});
        }
    }else{
        res.redirect("/home");
    }
})
app.post("/logout/:ssID", async (req,res) => {
    const {ssID} = req.params;
    if(await validateCookie(ssID)){
        const cookies = await readData("cookie.json");
        delete cookies[ssID];
        await writeData("cookie.json", cookies);
        res.redirect("/home")
    }else{
        res.redirect("/home");
    }
})
app.get('/api/:uname/:pass', async (req,res) => {
    const { uname,pass } = req.params;
    if(await doesUserExist(uname)){
        const serID = await getSerID(uname);
        if(await checkPass(serID,pass)) {
            console.log("get request received");
            const swStates = await readData("switchstates.json");
            const data = swStates[serID];
            const arr = [data[0]+1,data[1]+1,data[2]+1,data[3]+1,data[4]+1];
            res.json(arr);
        }
        else{
            res.status(403).send("Incorrect password");
        }
    }else{
        res.status(404).send("User not found");
    }
})
app.post("/api/swcontrol", async (req,res) => {
    const {pin4,pin5,pin6,pin7,pin8,username,password} = req.body;
    if(await doesUserExist(username)){
    const serID = await getSerID(username);
    if(await checkPass(serID,password)){
        const swControl = await readData("switchcontrol.json");
        const arr = [];
        arr[0] = ((pin4 == true)?1:0);
        arr[1] = ((pin5 == true)?1:0);
        arr[2] = ((pin6 == true)?1:0);
        arr[3] = ((pin7 == true)?1:0);
        arr[4] = ((pin8 == true)?1:0);
        swControl[serID] = arr;
        await writeData("switchcontrol.json",swControl);
    }else{
        res.status(403).send("Access denied because of incorrect password");
    }
    }else{
        res.status(401).send("The server is unable to recognize you. Please recheck username")
    }
})
app.get('*',(req, res) => {
    res.redirect("/home");
})
app.listen(port, () => {
    console.log("Listening on port 3000")
})
