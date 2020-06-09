$( document ).ready(function() {
    console.log( "ready!" );
	
	swidth = $(window).width();
	sheight = $(window).height();
	menusize = btnNum*(btnSize+btnPadding) + btnPadding;
	
	//for testing in browser only:
	//sublist = ["earthporn"];
	//start();
});

var ticklength = 1000;

var sublist = [];
var imagecount = [];
var redditdata = [];
var oddbox = false;
var limit = 50;
var delay = 5000;
var interval = null;
var running = false;
var fadeduration = 500;
var requireminres = true;
var minaspectratio = 0;
var swidth = 1920;
var sheight = 1080;
var sortfrom = "hot";
var appendQS = "";

var wpstack = [];

var menupos = 0.0;
var btnSize = 30;
var btnNum = 4;
var btnPadding = 2;
var menusize = 0;
var menuIsVertical = false;

var wpPaused = false;
window.wallpaperPropertyListener = {
	applyUserProperties: function(properties) {
		if (properties.delaytime) {
			delay = properties.delaytime.value * 1000;
		}
		
		if (properties.subredditlist) {
			var subredditlist = properties.subredditlist.value;
			var sublistarr = subredditlist.split(",").map(function (sub) { return sub.trim(); });
			for(var i = 0; i<sublistarr.length; i++) {
				if (/^\s*$/.test(sublistarr[i])) { //remove empty entries
					sublistarr.splice(i, 1);
					i--;
				}
				if (!(/^[a-zA-Z\d\_]{1,21}$/.test(sublistarr[i]))) { //remove entries that don't fit the subreddit naming scheme
					sublistarr.splice(i, 1);
					i--;
				}
			}
			sublist = sublistarr;
		}
		
		if (properties.fadetime) {
			fadeduration = properties.fadetime.value;
		}
		
		if (properties.showmenu) {
			if (properties.showmenu.value > 1) {
				$("#menu").show();
			} else {
				$("#menu").hide();
			}
			
			if (properties.showmenu.value == 2) {
				$("#menu").addClass("onlyshowonhover");
			} else {
				$("#menu").removeClass("onlyshowonhover");
			}
		}
		
		if (properties.menuedge) {
			if (properties.menuedge.value == 2 || properties.menuedge.value == 5) {
				setMenuVertical(true);
			} else {
				setMenuVertical(false);
			}
			
			$(".menuitemtooltip").removeClass("tooltip-right");
			$(".menuitemtooltip").removeClass("tooltip-left");
			$(".menuitemtooltip").removeClass("tooltip-top");
			$(".menuitemtooltip").removeClass("tooltip-bottom");
			
			if (properties.menuedge.value == 1) {
				$("#menu").css("top", 0);
				$("#menu").css("bottom", "");
				$("#menu").css("right", "");
				$(".menuitemtooltip").addClass("tooltip-top");
			} else if (properties.menuedge.value == 2) {
				$("#menu").css("right", 0);
				$("#menu").css("left", "");
				$("#menu").css("bottom", "");
				$(".menuitemtooltip").addClass("tooltip-right");
			} else if (properties.menuedge.value == 3) {
				$("#menu").css("bottom", 0);
				$("#menu").css("right", "");
				$("#menu").css("top", "");
				$(".menuitemtooltip").addClass("tooltip-bottom");
			} else if (properties.menuedge.value == 4) {
				$("#menu").css("bottom", 40);
				$("#menu").css("right", "");
				$("#menu").css("top", "");
				$(".menuitemtooltip").addClass("tooltip-bottom");
			} else if (properties.menuedge.value == 5) {
				$("#menu").css("left", 0);
				$("#menu").css("right", "");
				$("#menu").css("bottom", "");
				$(".menuitemtooltip").addClass("tooltip-left");
			}
			
			positionMenu();
		}
		
		if (properties.menupos) {
			menupos = (properties.menupos.value-1) / 99.0;
			positionMenu();
		}
		
		if (properties.requireminres) {
			requireminres = properties.requireminres.value;
		}
		if (properties.requireaspectratio) {
			var val = properties.requireaspectratio.value;
			if (val == 1) minaspectratio = 0;
			if (val == 2) minaspectratio = 1;
			if (val == 3) minaspectratio = 4.0/3.0;
			if (val == 4) minaspectratio = 16.0/9.0;
		}
		if (properties.postlimit) {
			//limit = properties.postlimit.value;
		}
		
		if (properties.loadfrom) {
			var val = properties.loadfrom.value;
			appendQS = "";
			
			if (val == 1) sortfrom = "hot";
			if (val == 2) sortfrom = "new";
			if (val == 3) sortfrom = "rising";
			if (val == 4) sortfrom = "controversial";
			if (val >= 5) sortfrom = "top";
			
			if (val == 5) appendQS = "&t=hour";
			if (val == 6) appendQS = "&t=week";
			if (val == 7) appendQS = "&t=month";
			if (val == 8) appendQS = "&t=year";
			if (val == 9) appendQS = "&t=all";
		}
		
		start();
	},
	setPaused: function(isPaused) {
		wpPaused = isPaused;
	}
};

function positionMenu() {
	if (menuIsVertical) {
		$("#menu").css("top", Math.floor((sheight-menusize)*menupos)+"px");
	} else {
		$("#menu").css("left", Math.floor((swidth-menusize)*menupos)+"px");
	}
	
	if (menupos > 0.55) {
		$("#menu").addClass("tooltipwrap");
	} else {
		$("#menu").removeClass("tooltipwrap");
	}
}

function start() {
	if (!running) {
		running = true;
		loadFromListRandom();
		setInterval(tick, ticklength);
	}
}

var wpTime = 0;
var playing = true;

function tick() {
	if (playing && !wpPaused) {
		wpTime += ticklength;
		if (wpTime >= delay) {
			nextWP();
		}
	}
}

function nextWP() {
	loadFromListRandom();
	wpTime = 0;
}

function prevWP() {
	if (wpstack.length > 1) {
		wpstack.pop(); //current
		var last = wpstack.pop();
		var img = redditUrlDecode(redditdata[last.sub][last.idx].data.preview.images[0].source.url);
		//var img = redditdata[last.sub][last.idx].data.url;
		loadImg(img, last.sub, last.idx);
		wpTime = 0; //display for the full length
	}
}

function loadFromListRandom() {
	var subredditidx = Math.floor(Math.random()*sublist.length);
	loadFromSubredditOrFetch(subredditidx, 0);
	
}

function loadFromSubredditOrFetch(subredditidx, depth) {
	if (depth >= sublist.length) { //oh no, we couldn't load images anywhere...
		showError(true); //show error message
		return;
	}
	
	subredditidx %= sublist.length;
	var subreddit = sublist[subredditidx];
	if (redditdata[subreddit]) {
		loadFromSubredditOrRetry(subredditidx, depth);
	} else {
		/*$.getJSON("https://www.reddit.com/r/"+subreddit+"/hot.json?limit="+limit, function(data, status){
			redditdata[subreddit] = data.data.children;
			loadFromSubredditOrRetry(subredditidx, depth);
		});*/
		$.ajax({
			url: "https://www.reddit.com/r/"+subreddit+"/"+sortfrom+".json?limit="+limit+appendQS,
			success: function(data, status){
				redditdata[subreddit] = data.data.children;
				loadFromSubredditOrRetry(subredditidx, depth);
			},
			error: function(err) {
				//that didn't work, maybe subreddit doesn't exist? try next one...
				loadFromSubredditOrFetch(subredditidx+1, depth+1);
			}
		});
	}
}

function showError(show) {
	$("#errmsg").css("display", show?"block":"none");
}

function loadFromSubredditOrRetry(subredditidx, depth) {
	var subreddit = sublist[subredditidx];
	var succ = loadNextImage(subreddit, redditdata[subreddit]);
	if (!succ) {
		loadFromSubredditOrFetch(subredditidx+1, depth+1);
	}
}

function loadNextImage(subreddit, data) {
	if (!imagecount[subreddit]) {
		imagecount[subreddit] = 0;
	}
	
	var imgNum = 0;
	
	var i = imagecount[subreddit];
	for(var k = 0; k<data.length; k++) {
		if (i >= data.length) i = 0;
		var post = data[i].data;
		if (post.preview && post.preview.images[0]) {
			var imgData = post.preview.images[0].source;
			if ((imgData.width >= swidth && imgData.height >= sheight) || !requireminres) {
				var aspect = imgData.width/parseFloat(imgData.height);
				if(aspect >= minaspectratio) {
					//var img = post.url;
					var img = redditUrlDecode(imgData.url);
					loadImg(img,subreddit,i);
					imagecount[subreddit] = (i+1) % data.length;
					console.log("showing #"+(i+1)+" from r/"+subreddit);
					
					showError(false);
					return true;
				} else {
					console.log("skipping #"+(i+1)+" from r/"+subreddit+" because aspect ratio too low: "+aspect);
				}
			} else {
				console.log("skipping #"+(i+1)+" from r/"+subreddit+" because width or height too low: "+imgData.width+"x"+imgData.height);
			}
		} else {
			console.log("skipping #"+(i+1)+" from r/"+subreddit+" because it's not an image post");
		}
		i++;
	}
	
	return false;
}

function loadImg(img,subreddit,i) {
	$('<img/>').attr('src', img).on('load', function() {
		$(this).remove();
		$("#box"+(oddbox?2:1)).css("background-image",'url('+img+')');
		if (oddbox) {
			if (fadeduration == 0) $("#box2").show();
			else $("#box2").fadeIn(fadeduration, function() {
				skipDisabled = false;
			});
		} else {
			if (fadeduration == 0) $("#box2").hide();
			else $("#box2").fadeOut(fadeduration, function() {
				skipDisabled = false;
			});
		}
		wpstack.push({
			"sub": subreddit,
			"idx": i
		});
		loadInfo(redditdata[subreddit][i].data);
		oddbox = !oddbox;
	});
}

function loadInfo(data) {
	$("#pTitle").text(data.title);
	$("#pSub").text(data.subreddit_name_prefixed);
	$("#pUser").text(data.author);
	var img = data.preview.images[0].source;
	$("#pRes").text(img.width+"x"+img.height);
	$("#pDate").text(new Date(data.created_utc*1000).toJSON().slice(0, 19).replace('T', ' ')+" UTC");
	$("#pPoints").text(data.score);
	$("#pComments").text(data.num_comments);
	$("#pUrl").text(data.url);
	$("#pLink").text(data.permalink);
	$("#pUrlInput").val(data.url);
	$("#pLinkInput").val("https://reddit.com"+data.permalink);
}

var skipDisabled = false;

function setMenuVertical(vertical) {
	if (vertical) {
		$("#menu").removeClass("menu-horizontal");
		$("#menu").addClass("menu-vertical");
	} else {
		$("#menu").removeClass("menu-vertical");
		$("#menu").addClass("menu-horizontal");
	}
	menuIsVertical = vertical;
}

function btn(id) {
	if (id == "togglePlay") {
		if (playing) {
			$("#playbutton").css("background-image", "url(play.png)");
		} else {
			$("#playbutton").css("background-image", "url(pause.png)");
		}
		playing = !playing;
	} else if (id == "back") {
		if (!skipDisabled) {
			prevWP();
			skipDisabled = true;
		} 
	} else if (id == "skip") {
		if (!skipDisabled) {
			nextWP();
			skipDisabled = true;
		} 
	} else if (id == "info") {
		
	}
}

//reddit escapes urls, so we need to replace &amp; with &
function redditUrlDecode(redditUrl) {
	return $("<span/>").html(redditUrl).text();
	//return redditUrl.replace(/\&amp\;/g, "&");
}

function copyField(inputField) {
  $("#"+inputField).select();
  document.execCommand("copy");
}