const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { webContents } = require('electron');

const { app, BrowserWindow, Menu, ipcMain } = electron;

process.env.NODE_ENV = 'development';

let mainWindow;
let addWindow;
const todoStorage = './storage/todos.json';

app.on('ready', function(){
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.once('ready-to-show', ()=> mainWindow.show());

    mainWindow.on('closed', function(){
        app.quit();
    })
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

app.allowRendererProcessReuse = true;

function createAddWindow(){
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add shopping list item',
        webPreferences: {
            nodeIntegration: true
        }
    });

    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Garbage collection
    addWindow.on('close', function(){
        addWindow = null;
    })

}

const readFileToJson = (path) => JSON.parse(fs.readFileSync(path));


const fetchTodos = exports.fetchTodos = () => readFileToJson(todoStorage);


const newTodo = exports.newTodo = async (data) =>{
    const todos = fetchTodos();

    data.id = todos.length;
    todos.push(data);
    
    fs.writeFileSync(todoStorage, JSON.stringify(todos), (err)=>{console.log(err)});
}

const deleteTodo = exports.deleteTodo = (id) =>{
    const todos = fetchTodos();

    let newlist = todos.filter(item => item.id !== parseInt(id));

    fs.writeFileSync(todoStorage, JSON.stringify(newlist), (err)=> conosle.log(err));
}

ipcMain.on('item:add', function(e, item){
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
})

const loadPage  = (filename) =>{
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, filename),
        protocol: 'file:',
        slashes: true
    }));
}

const mainMenuTemplate = [
    {
        label: 'Pages',
        submenu: [
            {
                label: 'Home',
                click(){
                    loadPage('mainWindow.html');
                }
            },
            {
                label: 'toDataUrl',
                click(){
                    loadPage('./pages/toDataUrl.html');
                }
            },
            {
                label: 'Todo list',
                click(){
                    loadPage('./pages/todo.html');
                }
            },
            {
                label: 'About',
                click(){
                    loadPage('./pages/about.html');
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'DevTools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+Shift+I' : 'Ctrl+Shift+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                },
            },
            {
                role: 'reload'
            }
        ],
    })
}