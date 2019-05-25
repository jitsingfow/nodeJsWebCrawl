const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mongoose = require('mongoose');
// const { URL } = require('url');

mongoose.connect('mongodb://localhost/webCrawl', { useNewUrlParser: true });

var webLinks = mongoose.Schema({
    link: String,
    referenceCount: Number,
    paramList: Array
});
var WebLinks = mongoose.model("WebLinks", webLinks);

// const uri = "https://medium.com/@nodejs";
const uri = "https://medium.com/some/thing";
// const uri = "https://medium.com/@priya_ebooks";

var parameter = '';

var blackListUrlsArray = [];

var crawlQueueArray = [];

var reqIndexFlag = 4;

function crawlQueueInsert(url) {

    var index = blackListUrlsArray.indexOf(url);
    if (index === -1) {
        crawlQueueArray.push(url);
        return true;
    } else {
        return false;
        console.log("Element already exists in queue")
    }

}

function crawlQueueShift() {
    return crawlQueueArray.shift();
}

function blackListUrl(url) {
    var index = blackListUrlsArray.indexOf(url);
    if (index === -1) {
        blackListUrlsArray.push(url);
        return true;
    } else {
        return false;
        console.log("Element already exists in blackListUrlsArray")
    }
}




function crawlWeb(uri) {

    request(uri, function (err, res, body) {
        if (err) {
            console.log("Error in making request");
        }
        else {
            console.log("####################    Starting -  webcrawl ##################################");

            let $ = cheerio.load(body);

            var links = $('a');


            var referenceCount = links.length;

            var linksArray = [];

            $(links).each(function (i, link) {
                linksArray.push($(link).attr('href'));
            });

            var arrayOfResObj = [];

            for (var item in linksArray) {
                var resObj = {};

                var listOfParams = [];

                var splitesUrl = linksArray[item].split('?');

                if (arrayOfResObj.length) {
                    for (var r = 0; r < arrayOfResObj; r++) {
                        if (splitesUrl[0] === arrayOfResObj[i].link) {
                            arrayOfResObj[i].referenceCount = arrayOfResObj[i].referenceCount + 1;
                        }
                    }
                }


                resObj.link = splitesUrl[0];

                if (splitesUrl.length > 1) {
                    var paramStringArray = splitesUrl[1].split('&');

                    paramStringArray.forEach(function (element) {
                        listOfParams.push(element.split('=')[0]);
                    });
                    resObj.paramList = Array.from(new Set(listOfParams));
                }
                resObj.referenceCount = 0;
                // console.log("Res :: ", resObj);
                arrayOfResObj.push(resObj);
            }
            if (arrayOfResObj.length>0) {
                //to save in DB
                arrayOfResObj.forEach(function (obj) {
                    var newWebLinks = new WebLinks(obj);
                    newWebLinks.save(function (err, webLinks) {
                        if (err) {
                            console.log(err);
                        }
                        console.log(obj);
                        console.log("saved a record");;
                    });
                });
                return arrayOfResObj;
            }
        }
    });
}


function main(uri) {

    if(blackListUrlsArray.indexOf(uri) === -1){
        crawlQueueInsert(uri);
        
        crawlWeb(uri);
        //crawlQueueShift();
        blackListUrl(uri);
    }
    
}

main(uri);

