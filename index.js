var fs = require('fs');
var hash = require('hash-file');
var readableStream = fs.createReadStream('/tmp/shairport-sync-metadata');
var writableStream = fs.createWriteStream('/tmp/shairport-sync-metadata.log', {flags: 'a'});
var parseString = require('xml2js').parseString;
var atob = require('atob');
var blessed = require('blessed');
var fileType = require('file-type');
var cmd = require('node-cmd');

var item = "";
var itemCache = "";
var items = [];

var song = {
    title: '',
    artist: '',
    album: '',
    imageFound: false
};

var screen = blessed.screen({
  smartCSR: true
});

screen.title = 'Shairplay Track Detail';

var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '100%',
  height: '50%',
  content: 'Awaiting track details...',
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});



//screen.append(box);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});



box.update = function(song) {
    screen.append(this);
    box.setContent('{center}Currently playing:{/center}\n');
    
    if(song.imageFound) {
        this.icon = blessed.image({
            parent: this,
            top: 0,
            left: 0,
            type: 'overlay',
            width: 'shrink',
            height: 'shrink',
            file: '/tmp/airplay_image.png',
            search: false,
            w3m: '/usr/lib/w3m/w3mimgdisplay'
        });    
    } else {
        box.setLine(1, '{center}no image yet...{/center}');
    }
    
    if(song.title)
        box.insertLine(1, '{center}' + song.title + '{/center}');
        
    if(song.album)
        box.insertLine(1, '{center}' + song.album + '{/center}');
        
    if(song.artist)
        box.insertLine(1, '{center}' + song.artist + '{/center}');
        
        
    box.focus();
    screen.render();
    //cmd.run('echo -ne "\033[9;0]" >/dev/tty1');
}


readableStream.on('data', function(chunk) {
    try {
    
        var data = chunk.toString("utf-8").trim().replace(/\r?\n|\r/g, '');

        if(data.indexOf("<item>") == 0) {
            items = data.split('<item>');
            for (var i in items) {
                if(items[i].indexOf("</item>") == -1) {
                    itemCache = items[i];
                } else {
                    parseString("<item>" + items[i], function (err, result) {
                        if(result) {
                            switch(result["item"]["code"][0]) {
                                case "6173616c": 
                                    if(song.album != atob(result["item"]["data"][0]._))
                                        song.imageFound = false;
                                    //console.log("Album: " + atob(result["item"]["data"][0]._));
                                    song.album = atob(result["item"]["data"][0]._);
                                    break;
                                case "61736172": 
                                    //console.log("Artist: " + atob(result["item"]["data"][0]._));
                                    song.artist = atob(result["item"]["data"][0]._);
                                    break;
                                case "6d696e6d": 
                                    //console.log("Title: " + atob(result["item"]["data"][0]._));
                                    song.title = atob(result["item"]["data"][0]._);
                                    break;
                                 case "50494354": 
                                    //console.log("Image Found");
                                    //console.log(result["item"]["data"][0]._);
                                    fs.writeFile("/tmp/airplay_image.png", new Buffer(result["item"]["data"][0]._, "base64"), function(err){
                                        if(err) {
                                            return console.log(err);
                                        }
                                    });
                                    song.imageFound = true;
                                    break;
                           }
                        }
                    });
                }
            }
        } else if(data.indexOf("<item>") > 0) {
            data = itemCache + data;
            items = data.split('<item>');
            for (var i in items) {
                if(items[i].indexOf("</item>") == -1) {
                    itemCache = items[i];
                } else {
                    parseString("<item>" + items[i], function (err, result) {
                        if(result) {
                            switch(result["item"]["code"][0]) {
                                case "6173616c": 
                                    if(song.album != atob(result["item"]["data"][0]._))
                                        song.imageFound = false;
                                    //console.log("Album: " + atob(result["item"]["data"][0]._));
                                    song.album = atob(result["item"]["data"][0]._);
                                    break;
                                case "61736172": 
                                    //console.log("Artist: " + atob(result["item"]["data"][0]._));
                                    song.artist = atob(result["item"]["data"][0]._);
                                    break;
                                case "6d696e6d": 
                                    //console.log("Title: " + atob(result["item"]["data"][0]._));
                                    song.title = atob(result["item"]["data"][0]._);
                                    break;
                                case "50494354": 
                                    //console.log("Image Found");
                                    fs.writeFile("/tmp/airplay_image.png", new Buffer(result["item"]["data"][0]._, "base64"), function(err){
                                        if(err) {
                                            return console.log(err);
                                        }
                                    });
                                    
                                    song.imageFound = true;
                                    break;
                            }
                        }
                    });
                }
            }
        } else {
            if(data.indexOf("</item>") == -1) {
                itemCache += data;
            } else {
                parseString("<item>" + itemCache + data, function (err, result) {
                    if(result) {
                        switch(result["item"]["code"][0]) {
                            case "6173616c": 
                                if(song.album != atob(result["item"]["data"][0]._))
                                    song.imageFound = false;
                                //console.log("Album: " + atob(result["item"]["data"][0]._));
                                song.album = atob(result["item"]["data"][0]._);
                                break;
                            case "61736172": 
                                //console.log("Artist: " + atob(result["item"]["data"][0]._));
                                song.artist = atob(result["item"]["data"][0]._);
                                break;
                            case "6d696e6d": 
                                //console.log("Title: " + atob(result["item"]["data"][0]._));
                                song.title = atob(result["item"]["data"][0]._);
                                break;
                             case "50494354": 
                                //console.log("Image Found");
                                //console.log(result["item"]["data"][0]._);
                                fs.writeFile("/tmp/airplay_image.png", new Buffer(result["item"]["data"][0]._, "base64"), function(err){
                                    if(err) {
                                        return console.log(err);
                                    }
                                });
                                song.imageFound = true;
                                break;
                       }
                    }
                });
            }
        }
            
        item = "";
        items = [];
        
    } catch (e) {
        console.log(e);
        item = "";
    }
    
    box.update(song);
});


readableStream.on('end', function() {
console.log("END: " + data);
});
