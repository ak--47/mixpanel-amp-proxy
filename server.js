require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const parser = require('ua-parser-js');
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;
const token = process.env.TOKEN || "";

if (!token) {
	console.error("No token found in .env file. Please add a TOKEN entry.");
	process.exit(1);
}

const Mixpanel = require("mixpanel");
const mixpanel = Mixpanel.init(token, {
	debug: true,
	protocol: "https",
	verbose: true,
});

// Custom middleware to handle text/plain as JSON
// ? for some reason amp analytics sends 'text/plain' as the content-type
app.use((req, res, next) => {
	if (req.headers['content-type'] === 'text/plain') {
		let data = '';
		req.on('data', chunk => {
			data += chunk;
		});
		req.on('end', () => {
			try {
				req.body = JSON.parse(data);
			} catch (e) {
				req.body = data;
			}
			next();
		});
	} else {
		next();
	}
});

app.use(cors({ credentials: false, allowedHeaders: "*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//the proxy will parse data from the <amp-analytics> UI component, and send it to mixpanel
app.all("*", (req, res) => {
	const { method, path, body, headers, ip, query } = req;
	const {
		eventName = "",
		userId = "",
		anonymousId = "",
		...defaultProps
	} = query;
	const { props } = body;

	//todo parse ua like sdk
	const ua = parser(headers['user-agent']);

	if (ip) defaultProps.ip = ip;
	if (path === "/" || path === "/event") {
		if (userId) defaultProps.$user_id = userId;
		if (anonymousId) defaultProps.$device_id = anonymousId;

		mixpanel.track(eventName, { ...props, ...defaultProps }, (err) => {
			if (err) {
				console.error("Error tracking event:", err);
				res.status(500).send("error");
			}
			res.status(200).send("ok");
		});
	}

	else if (path === '/user') {
		if (!userId) {
			res.status(400).send("userId is required for profile updates");
		}

		mixpanel.people.set(userId, { ...props, ...defaultProps }, (err) => {
			if (err) {
				console.error("Error setting user:", err);
				res.status(500).send("error");
			}
			res.status(200).send("ok");
		});
	}

	else {
		res.status(404).send("not found");
	}

});

app.listen(port, () => {
	console.log(`PROXY LISTENING ON ${port}`);
});


/** 

todo: copy SDK

event props defaults
{
		'$os': _.info.os(),
		'$browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
		'$referrer': document.referrer,
		'$referring_domain': _.info.referringDomain(document.referrer),
		'$device': _.info.device(userAgent)	
		'$current_url': win.location.href,
		'$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera),
		'$screen_height': screen.height,
		'$screen_width': screen.width,
		'mp_lib': 'web',
		'$lib_version': Config.LIB_VERSION,
		'$insert_id': cheap_guid(),
		'time': _.timestamp() 

}

user prop defaults
'$os': _.info.os(),
'$browser': _.info.browser(userAgent, navigator.vendor, windowOpera)
'$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera)


pageView props defaults
{
		'current_page_title': document.title,
		'current_domain': win.location.hostname,
		'current_url_path': win.location.pathname,
		'current_url_protocol': win.location.protocol,
		'current_url_search': win.location.search
	
}


 */
