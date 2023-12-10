/**
 * A simple proxy server to handle <amp-analytics> requests and send them to mixpanel
 * by ak@mixpanel.com
 *
 * DOCS
 * ? https://amp.dev/documentation/components/websites/amp-analytics
 * ? https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/configure-analytics/analytics_basics
 * ? https://github.com/ampproject/amphtml/blob/main/docs/spec/amp-var-substitutions.md
 *
 */

const express = require("express");
const bodyParser = require("body-parser");
const parser = require("ua-parser-js");
const app = express();
const debug = process.env.DEBUG || false;
const Mixpanel = require("mixpanel");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// middleware to dynamically set CORS headers for the calling domain
app.use((req, res, next) => {
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Methods", "GET, POST");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// middleware to handle text/plain as JSON
// ? <amp-analytics> sends 'text/plain' as the content-type: https://github.com/ampproject/amphtml/issues/22167#issuecomment-493587359
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
	const { path, body, headers, ip } = req;

	const { eventName = "", userId = "", anonymousId = "", token = "", time = "", userAgent = "", superProps = {}, defaultProps = {}, ...props } = body;

	if (!token) {
		res.status(400).send("token is required");
		return;
	}

	// todo: maybe cache this?
	const mixpanel = Mixpanel.init(token, {
		debug,
		protocol: "https",
		verbose: false,
	});

	// PARSE USER AGENT
	const ua = parser(userAgent) || parser(headers["user-agent"]);
	const parsedUserAgent = {
		$os: ua.os.name,
		$os_version: ua.os.version,
		$browser: ua.browser.name,
		$browser_version: ua.browser.version,
		$device: ua.device.model,
	};

	// MERGE PROPERTIES
	const properties = { ...parsedUserAgent, ...superProps, ...props };
	if (ip) properties.ip = ip;

	// TRACK EVENT
	if (path === "/" || path.startsWith("/event")) {
		if (!eventName) {
			res.status(400).send("eventName is required");
			return;
		}

		if (userId) properties.$user_id = userId;
		if (anonymousId) properties.$device_id = anonymousId;
		if (time && !isNaN(Number(time))) properties.time = Number(time);

		mixpanel.track(eventName, properties, (err) => {
			if (err) {
				console.error("Error tracking event:", err);
				res.status(500).send("error");
				return;
			}
			// ^ why is there no response??

			res.status(200).send("ok");
			return;
		});
	}

	// IDENTIFY USER ... only matters for original id merge
	else if (path === "/identify") {
		if (!userId) {
			res.status(400).send("userId is required for /identify");
			return;
		}

		if (!anonymousId) {
			res.status(400).send("anonymousId is required for /identify");
			return;
		}

		// ? https://developer.mixpanel.com/reference/create-identity
		const identityMerge = {
			$identified_id: userId,
			$anon_id: anonymousId,
		};

		mixpanel.track("$identify", identityMerge, (err) => {
			if (err) {
				console.error("Error tracking event:", err);
				res.status(500).send("error");
				return;
			}

			res.status(200).send("ok");
			return;
		});
	}

	// SET USER PROPERTIES... requires userId
	else if (path.startsWith("/user")) {
		if (!userId) {
			res.status(400).send("userId is required for /user");
			return;
		}

		mixpanel.people.set(userId, properties, (err) => {
			if (err) {
				console.error("Error setting user:", err);
				res.status(500).send("error");
				return;
			}
			res.status(200).send("ok");
			return;
		});
	} else {
		res.status(404).send("not found");
		return;
	}
});





module.exports = app;