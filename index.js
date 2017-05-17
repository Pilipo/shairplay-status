var fs = require('fs');
var readableStream = fs.createReadStream('/tmp/shairport-sync-metadata');
var parseString = require('xml2js').parseString;
var atob = require('atob');
var blessed = require('blessed');
var fileType = require('file-type');
var cmd = require('node-cmd');

var item = "";
var items = [];

var song = {};

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

screen.append(box);

box.on('click', function(data) {
    screen.append(this);
    this.focus();
    screen.render();
    this.update(song);
});


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

box.update = function(song) {
    //console.log(song);
    box.setContent('{center}Currently playing:{/center}\n');
    
    if(song.title)
        box.setLine(1, '{center}' + song.title + '{/center}');
        
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
item += data;

//console.log(data);

if(data.indexOf("</item>") > -1) {
    
    items = data.split('<item>');
    for (var i in items) {
        
        parseString("<item>"+items[i], function (err, result) {
            if(result && result["item"] && result["item"]["type"]) {
               if(result["item"]["type"][0] == "636f7265") {
                    //console.log(result["item"]["code"][0]);
                    //if(result["item"]["data"])
                        //console.log(result["item"]["data"][0]);
    
                    switch(result["item"]["code"][0]) {
                        case "6173616c": 
                            //console.log("Album: " + atob(result["item"]["data"][0]._));
                            //console.log('');
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
                    }
                }
                /*
                if(result["item"]["type"][0] == "73736e63") {
                    console.log(result["item"]);
                    if(result["item"]["code"][0] == "50494354") {
                        console.log("found an image!");
                        //console.log(fileType(result["item"]["data"][0]._));
                    }
                }
                */
            }
        });
    }
    item = "";
}
}
catch (e) {
    console.log(e);
    item = "";
}

box.update(song);

//console.log(song);
});
readableStream.on('end', function() {
console.log("END: " + data);
});
