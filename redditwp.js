$( document ).ready(function() {
    console.log( "ready!" );
	
	swidth = $(window).width();
	sheight = $(window).height();
	menusize = btnNum*(btnSize+btnPadding) + btnPadding;
	
	//for testing in browser only:
	/*
	//sublist = "EarthPorn,CityPorn,SkyPorn,LakePorn,VillagePorn,waterporn,wallpaper,wallpapers,WQHD_Wallpaper,minimalisticwalls,MinimalWallpaper,ImaginaryLandscapes,ExposurePorn,naturepapers,naturepics,SpaceWalls,spaceporn,futureporn,ArchitecturePorn".split(',');
	sublist = ["EarthPorn"]
	$("#menu").show();
	menupos = 0.5;
	setMenuVertical(false);
	$("#menu").css("top", 0);
	$("#menu").css("bottom", "");
	$("#menu").css("right", "");
	$(".menuitemtooltip").addClass("tooltip-top");
	positionMenu();
	loadmode = 1;
	//sourceStr = sourceStrList = "r/EarthPorn+CityPorn+SkyPorn";
	//totallimit = 5;
	endless = true;
	sortfrom = "top";
	appendQS = "&t=day";
	reloadinterval = 1;
	start();
	*/
});

var ticklength = 1000;

var sublist = [];
var sublistCsv = null;
var sublistMulti = null;
var sourceStr = "";
var sourceStrList = null;
var sourceStrMulti = null;

var subselecttype = 1;
var multiApiUrl = null;
var refreshMultis = false;
var imagecount = [];
var imagelist = [];
var redditdata = [];
var oddbox = false;
var limit = 50;
var totallimit = 500;
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
var loadmode = 1;
var reloadinterval = 0;
var resetprogress = false;
var endless = false;

var wpstack = [];

var menupos = 0.0;
var btnSize = 30;
var btnNum = 4;
var btnPadding = 2;
var menusize = 0;
var menuIsVertical = false;

var currentPostId = null;
var lastQueryLength = 0;
var lastFetchTime = 0;
var lastReloadTime = Date.now();

var reset = true;

var stale = false;

var wpPaused = false;
window.wallpaperPropertyListener = {
	applyUserProperties: function(properties) {
		if (properties.delaytime) {
			delay = properties.delaytime.value * 1000;
		}
		
		if (properties.subselecttype) {
			subselecttype = properties.subselecttype.value;
			if (subselecttype == 1) {
				//$("#multiredditRefreshNote").hide();
				if (sublistCsv != null) sublist = sublistCsv;
				if (sourceStrList != null) sourceStr = sourceStrList;
			} else if (subselecttype == 2) {
				//$("#multiredditRefreshNote").show();
				if (sublistMulti != null) sublist = sublistMulti;
				if (sourceStrMulti != null) sourceStr = sourceStrMulti;
			}
		}
		
		//comma seperated list
		if (properties.subredditlist) {
			var subredditlist = properties.subredditlist.value;
			var sublistarr = subredditlist.split(/[,\+\s]+/).map(function (sub) { return sub.trim(); });
			for(var i = 0; i<sublistarr.length; i++) {
				if (/^\s*$/.test(sublistarr[i])) { //remove empty entries
					sublistarr.splice(i, 1);
					i--;
				} else if (!(/^[a-zA-Z\d\_]{1,21}$/.test(sublistarr[i]))) { //remove entries that don't fit the subreddit naming scheme
					sublistarr.splice(i, 1);
					i--;
				}
			}
			sublistCsv = sublistarr;
			sourceStrList = sublistarr.length > 0 ? "r/"+sublistarr.join('+') : "";
			if (subselecttype == 1) {
				sublist = sublistCsv;
				sourceStr = sourceStrList;
			}
		}
		
		//personal feed
		if (properties.multiredditurl) {
			var multiredditurl = properties.multiredditurl.value.trim().toLowerCase();
			var multiredditurlmatch = multiredditurl.match(/([a-z\d_-]+)\/m\/([a-z\d\_]+)/i);
			if (multiredditurlmatch != null) {
				multiApiUrl = "https://www.reddit.com/api/multi/user/"+multiredditurlmatch[1]+"/m/"+multiredditurlmatch[2];
				sourceStrMulti = "user/"+multiredditurlmatch[1]+"/m/"+multiredditurlmatch[2];
				if (subselecttype == 2) sourceStr = sourceStrMulti;
			}
			refreshMultis = true;
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
			limit = properties.postlimit.value;
			reset = true;
		}
		if (properties.totallimit) {
			totallimit = properties.totallimit.value;
		}
		if (properties.mode) {
			loadmode = properties.mode.value;
		}
		if (properties.reloadinterval) {
			reloadinterval = properties.reloadinterval.value;
		}
		if (properties.resetprogress) {
			resetprogress = properties.resetprogress.value;
		}
		if (properties.endless) {
			endless = properties.endless.value;
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
			if (val == 10) appendQS = "&t=day";
			
			reset = true;
		}
		
		if (subselecttype == 2 && loadmode == 1) {
			$("#multiredditRefreshNote").show();
		} else if (subselecttype == 2) {
			$("#multiredditRefreshNote").hide();
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
		loadWP();
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
	loadWP();
	wpTime = 0;
}

function prevWP() {
	if (wpstack.length > 1) {
		wpstack.pop(); //current
		var last = wpstack.pop();
		post = redditdata[last.sub][last.id];
		if (post) {
			loadImg(post);
			wpTime = 0; //display for the full length
		}
	}
}

function loadWP() {
	if (reset) {
		reset = false;
		imagelist = [];
		imagecount = [];
	}
	
	if (loadmode == 1) {
		loadFromListRandom();
	} else if (loadmode == 2) {
		loadFromRedditFeed();
	}
}

function loadFromRedditFeed() {
	if (sourceStr && sourceStr != null && sourceStr != "") {
		imglistkey = sourceStr;
		var idx = 0;
		if (imagecount[imglistkey]) idx = imagecount[imglistkey];
		
		var loadMore = false;
		var loadAmt = 25;
		var empty = false;
		var after = null;
		if (imagelist[imglistkey]) {
			if (imagelist[imglistkey].length == 0) {
				empty = true;
			} else {
				after = "t3_"+imagelist[imglistkey][imagelist[imglistkey].length-1]['id'];
				if (stale && idx == 0) {
					//we just wrapped back around and the beginning of the list needs to be reloaded
					imagecount[imglistkey] = [];
					loadMore = true;
					stale = false;
				}
			}
			
			if (idx >= totallimit && !endless) {
				//we have reached the end, wrap back around
				imagecount[imglistkey] = 0;
				loadFromRedditFeed();
			} else if (idx >= imagelist[imglistkey].length) {
				loadMore = true;
			} else {
				var succ = loadNextImage(imglistkey, false)
				if (!succ) {
					loadMore = true;
				}
			}
		} else {
			empty = true;
			loadMore = true;
		}
		
		if (!loadMore && reloadinterval > 0 && Date.now() > lastFetchTime + reloadinterval*60*1000) {
			console.log("reloading...");
			loadMore = true;
			if (currentPostId != null) {
				imagecount[imglistkey] = 0;
				imagelist[imglistkey] = [];
				after = "t3_"+currentPostId;
				stale = true;
			}
			if (resetprogress) {
				after = null;
			}
		}
		
		if (loadMore) {
			redditQuery(sourceStr, imglistkey, loadAmt, after, function() {
				if (empty && imagelist[imglistkey].length == 0) { 
					//was empty and still empty => no posts available.
					showError(true);
				} else {
					if (lastQueryLength == 0) {
						//there are no more posts available, go back to start
						imagecount[imglistkey] = 0;
						loadFromRedditFeed();
					} else if (idx < imagelist[imglistkey].length) {
						//call again, now that posts are loaded in
						loadFromRedditFeed();
					} else {
						//wtf?
						showError(true);
					}
				}
			}, function() {
				//error:
				if (imagelist[imglistkey].length == 0) { 
					showError(true); //no posts to show
				} else {
					//error loading, work with what we have
					imagecount[imglistkey] = 0;
					loadFromRedditFeed();
				}
			});
		}
	} else {
		showError(true);
	}
}

function loadFromListRandom() {
	//if using multireddits, do we need to refresh the sub list?
	if (subselecttype == 2 && refreshMultis) {
		refreshMultis = false;
		if (multiApiUrl == null) {
			sublist = sublistMulti = [];
			showError(true);
		} else {
			$.ajax({
				url: multiApiUrl,
				success: function(data, status) {
					if (data.data.subreddits) {
						var newsublist = [];
						for(var i = 0; i<data.data.subreddits.length; i++) {
							newsublist.push(data.data.subreddits[i].name);
						}
						sublist = sublistMulti = newsublist;
					} else {
						sublist = sublistMulti = [];
					}
					loadFromListRandom(); //now actually load
				},
				error: function(err) {
					sublist = sublistMulti = [];
					showError(true);
				}
			});
		}
		return;
	}
	
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
	
	if (reloadinterval > 0 && Date.now() > lastReloadTime + reloadinterval*60*1000) {
		console.log("reloading...");
		imagelist = []; //wipe list
		if (resetprogress) {
			imagecount = []; //wipe current offsets
		}
		lastReloadTime = Date.now();
	}
	
	if (imagelist[subreddit]) {
		loadFromSubredditOrRetry(subredditidx, depth);
	} else {
		redditQuery("r/"+subreddit, subreddit, limit, null, function() {
			//success:
			loadFromSubredditOrRetry(subredditidx, depth);
		}, function() {
			//error:
			//that didn't work, maybe subreddit doesn't exist? try next one...
			loadFromSubredditOrFetch(subredditidx+1, depth+1);
		});
	}
}

function redditQuery(feed, imglistkey, lmt, after, fn_success, fn_error) {
	appendAfter = "";
	if (after) appendAfter = "&after="+after;
	qurl = "https://www.reddit.com/"+feed+"/"+sortfrom+".json?limit="+lmt+appendQS+appendAfter;
	console.log("[apiquery] "+qurl);
	$.ajax({
		url: qurl,
		success: function(response, status){
			lastQueryLength = response.data.children.length;
			lastFetchTime = Date.now();
			for (var i = 0; i<response.data.children.length; i++) {
				var data = response.data.children[i].data;
				if (data) {
					if (!imagelist[imglistkey]) imagelist[imglistkey] = [];
					imagelist[imglistkey].push({
						"sub": data.subreddit,
						"id": data.id,
					});
					if (!redditdata[data.subreddit]) redditdata[data.subreddit] = [];
					redditdata[data.subreddit][data.id] = data;
				}
			}
			fn_success();
		},
		error: function(err) {
			fn_error();
		}
	});
}

function showError(show) {
	$("#errmsg").css("display", show?"block":"none");
}

function loadFromSubredditOrRetry(subredditidx, depth) {
	var subreddit = sublist[subredditidx];
	var succ = loadNextImage(subreddit, true);
	if (!succ) {
		loadFromSubredditOrFetch(subredditidx+1, depth+1);
	}
}

function loadNextImage(imglistkey, wrap) {
	if (!imagecount[imglistkey]) {
		imagecount[imglistkey] = 0;
	}
	
	var ilist = imagelist[imglistkey];
	
	var i = imagecount[imglistkey];
	for(var k = 0; k<ilist.length; k++) {
		if (i >= ilist.length) {
			if (wrap) i = 0;
			else return false;
		} 
		var post_ptr = ilist[i];
		var post = redditdata[post_ptr.sub][post_ptr.id];
		
		if (post && checkImage(post)) {
			loadImg(post);
			imagecount[imglistkey] = wrap ? (i+1) % ilist.length : i+1;
			console.log("showing #"+(i+1)+" ("+post.id+") from r/"+post.subreddit);
			showError(false);
			return true;
		} else {
			console.log("skipping #"+(i+1)+" ("+post.id+") from r/"+post.subreddit);
		}
		
		i++;
	}
	
	return false;
}

function checkImage(post) {
	if (post.preview && post.preview.images[0]) {
		var imgData = post.preview.images[0].source;
		if ((imgData.width >= swidth && imgData.height >= sheight) || !requireminres) {
			var aspect = imgData.width/parseFloat(imgData.height);
			if(aspect >= minaspectratio) {
				return true;
			} else {
				console.log(post.subreddit+":"+post.id+": aspect ratio too low: "+aspect);
			}
		} else {
			console.log(post.subreddit+":"+post.id+": width or height too low: "+imgData.width+"x"+imgData.height);
		}
	} else {
		console.log(post.subreddit+":"+post.id+": not an image post");
	}
	return false;
}

function loadImg(post) {
	
	var imgData = post.preview.images[0].source;
	var img = redditUrlDecode(imgData.url);
	
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
			"sub": post.subreddit,
			"id": post.id
		});
		currentPostId = post.id;
		loadInfo(post);
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
	} else if (id == "refreshMulti") {
		refreshMultis = true;
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