require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const parser = require("ua-parser-js");
const app = express();

const port = process.env.PORT || 3000;
const token = process.env.TOKEN || "";
const debug = process.env.DEBUG || false;

if (!token) {
	console.error("No token found in .env file. Please add a TOKEN entry.");
	process.exit(1);
}

const Mixpanel = require("mixpanel");
const mixpanel = Mixpanel.init(token, {
	debug,
	protocol: "https",
	verbose: true,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// middleware to dynamically set CORS headers for the calling domain
app.use((req, res, next) => {
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Methods", "GET, POST");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

// middleware to handle text/plain as JSON
// ? for some reason <amp-analytics> sends 'text/plain' as the content-type: https://github.com/ampproject/amphtml/issues/22167#issuecomment-493587359
app.use((req, res, next) => {
	if (req.headers["content-type"] === "text/plain") {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
		});
		req.on("end", () => {
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



//the proxy will parse data from the <amp-analytics> UI component, and send it to mixpanel
app.all("*", (req, res) => {
	const { method, path, body, headers, ip } = req;
	const {
		eventName = "",
		userId = "",
		anonymousId = "",
		props,
		...data
	} = body;

	const properties = { ...data, ...props };

	//todo parse ua like sdk
	const ua = parser(headers["user-agent"]);

	if (ip) properties.ip = ip;

	// EVENT TRACKING
	if (path === "/" || path === "/event") {
		if (userId) properties.$user_id = userId;
		if (anonymousId) properties.$device_id = anonymousId;

		mixpanel.track(eventName, properties, (err) => {
			if (err) {
				console.error("Error tracking event:", err);
				res.status(500).send("error");
			}
			res.status(200).send("ok");
		});
	} 
	
	// USER PROFILES
	else if (path === "/user") {
		if (!userId) {
			res.status(400).send("userId is required for profile updates");
		}

		mixpanel.people.set(userId, properties, (err) => {
			if (err) {
				console.error("Error setting user:", err);
				res.status(500).send("error");
			}
			res.status(200).send("ok");
		});
	} else {
		res.status(404).send("not found");
	}
});

app.listen(port, () => {
	console.log(`PROXY LISTENING ON ${port}`);
});

/** 

* todo: copy SDK defaults for each type

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
