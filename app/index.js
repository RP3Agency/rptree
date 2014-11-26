var twitter 	= require('ntwitter'),
	config		= require('config'),
	text    	= require('twitter-text'),
	twit 		= new twitter(config.twitter),
	terms		= ['rptree', '#rptree', '#wtf'];
	


console.log('tracking terms: ', terms);

twit.stream('statuses/filter', { track: terms }, function(stream) {
  stream.on('data', function (data) {
  	var twitterText = text.autoLink(data.text);
  	var incoming = {
  	      user: data.user.screen_name,
  	      text: twitterText,
  	      name: data.user.name,
  	      profileImage: data.user.profile_image_url,
  	      timestamp: new Date().getTime()
  	};
  	
	console.log(incoming);
	
	
  });
});
