const express = require('express') // express module need to install.
const https = require("https"); // Built in http module in node.js, no need to install.
const bodyParser = require('body-parser') // npm pakage, need to install.
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.set("view engine", "ejs");

require('dotenv').config()
mongo_url = process.env.url // Enter MongoDB atlas URL here

app.use(express.static("public")); // To serve static files such as images, CSS files, and JavaScript files, use the express.static built-in middleware function in Express.
app.use(bodyParser.urlencoded({ extended: true }));
// app.use is express middleware

mongoose.connect(mongo_url, { useNewUrlParser: true }); // Create database named todolistDB

// Create schema
const itemsSchema = new mongoose.Schema({
    name: String
});

// Create model
const Item = mongoose.model("Item", itemsSchema); // Create a collection named "Item", with structure of "itemsSchema".

// Add default items
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Press the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Press this to delete an item."
});

// Create item array
const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);



app.get('/', function (req, res) {

    // Log default items
    Item.find({}, function (err, items) {
        if (err) {
            console.log(err);
        } else {
            if (items.length === 0) {
                // Insert default items into database
                Item.insertMany( defaultItems, function(err){
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Default entries successful.");
                    }
                    res.redirect('/');
                });
            } else {
                res.render("list", { listTitle: "Today", newListItems: items });
            };
        };
    });    

})

app.post('/', function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}, (err, foundList) =>{
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    };
    
})

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, err => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/');
                console.log("Item removed successfully.");
            }
        });
    } else {
        // ***IMP*** => vid 348, at 11:00.
        // The $pull operator removes from an existing array all instances of a value or values that match a specified condition.
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    };

});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // Create a list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            } else {
                // Show a list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });

})

app.get('/work', function (req, res) {
    res.render('list', { listTitle: "Work List", newListItems: workItems })
})

app.get('/about', function (req, res) {
    res.render('about');
})

app.listen(process.env.PORT || 3000, function () { //process.env.PORT is used if third party server wants to assign a different port.
    console.log("Server is started on port 3000");
})
