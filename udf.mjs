import { readFile, writeFile } from 'fs/promises';

function getRandStr(leng){
    let num = "";
    for(let i = 0;i<leng;i++){
        const n = Math.floor(Math.random()*10);
        num = num + String(n);
    }
    return num;
}

async function readData(filePath) {
    try{
        const content = await readFile(filePath, "utf8");
        const cont = await JSON.parse(content);
        return cont;
    }catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
}

async function writeData(filePath, info) {
    try{
        await writeFile(filePath,JSON.stringify(info))
        return;
    }catch (error) {
        console.error("Error writing in this file: ", error);
        throw error;
    }
}

async function doesUserExist(user) {
    const Users = await readData("username.json");
    if(Object.values(Users).includes(String(user))){
        return true
    }
    return false
}
async function getSerID(uname) {
        const obj = await readData("username.json");
        for (let key of Object.keys(obj)) {
            if (obj[key] === uname) {
                return key;
            }
        }
        console.log("User not found");
        return -1; // Returning -1 if user not found
}
async function checkPass(uname,pass) {
    const data = await readData("passwords.json");
    if(data[uname] === pass){
        return true;
    }
    return false
}
async function clearCookies() {
    const cookies = await readData("cookie.json");
    const currTime = new Date();
    const newCookie = {}
    for(let key in cookies){
        const validTime = new Date(cookies[key]["validTime"]);
        if(currTime < validTime){
            newCookie[key] = cookies[key];
        }
    }
    await writeData("cookie.json",newCookie);
}
async function validateCookie(ssID){
    const cookies = await readData("cookie.json");
    if(cookies[ssID]){
        const cookie = cookies[ssID];
        const currTime = new Date();
        const validTime = new Date(cookie["validTime"]);
        if((validTime > currTime)){
            return true;
        }else{
            await clearCookies()
        }
    }
    return false;
}
async function getCookie(ssID) {
    if(await validateCookie(ssID)){
        const cookies = await readData("cookie.json");
        const cookie = cookies[ssID];
        return cookie
    }
    else{
        throw new Error;
    }
}
async function isConnected(ssID){
    return true;
}
export {getRandStr,readData,getCookie,writeData,doesUserExist,getSerID,checkPass,isConnected,clearCookies,validateCookie}