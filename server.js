const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const mongoose = require('mongoose');
// const { URL } = require('url');

mongoose.connect('mongodb://localhost/webCrawl', { useNewUrlParser: true });

var webLinks = mongoose.Schema({
    link: String,
    uniqueLinks: Array,
    referenceCount: Number,
    paramList: Array
});

var WebLinks = mongoose.model("WebLinks", webLinks);

// var uri = "https://medium.com/@nodejs";
//var uri = "https://medium.com/some/thing";
// var uri = "https://medium.com/@priya_ebooks";

var uri = process.argv[2];

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
        console.log("Element already exists in queue")
        return false;
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
        console.log("Element already exists in blackListUrlsArray")
        return false;
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

            var linksArray = [];

            //all href links
            $(links).each(function (i, link) {
                linksArray.push($(link).attr('href'));
            });

            

            var dbObj = {};

            var linksAndParams = [];

            for (var i = 0; i < linksArray.length; i++) {

                var splitesUrl = linksArray[i].split('?');

                if (splitesUrl.length > 1) {
                    var paramStringArray = splitesUrl[1].split('&');
                    var listOfParams = [];

                    paramStringArray.forEach(function (element) {
                        listOfParams.push(element.split('=')[0]);
                    });
                    linksAndParams.push({
                        link: splitesUrl[0],
                        params: Array.from(new Set(listOfParams))
                    });
                }
                else {
                    linksAndParams.push({
                        link: splitesUrl[0]
                    });
                }
            }

            var filteredList = linksAndParams.filter(function (obj) {
                return obj.link === uri;
            });

            dbObj.link = uri;

            var uniqueLinks = Array.from(new Set(linksAndParams.map(function (element) {
                return element.link;
            })));

            dbObj.uniqueLinks = uniqueLinks;

            var paramsList = [];
            linksAndParams.forEach(function (element) {
                if (element.link === uri) {
                    if (element.params != undefined) {
                        element.params.forEach(function (param) {
                            paramsList.push(param);
                        });
                    }
                }
            });

            dbObj.paramList = Array.from(new Set(paramsList));
            dbObj.referenceCount = filteredList.length;

            var newWebLinks = new WebLinks(dbObj);
            newWebLinks.save(function (err, webLinks) {
                if (err) {
                    console.log(err);
                }
                console.log("saved a record");;
            });

            return {newLinks: uniqueLinks};
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

