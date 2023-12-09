# AMP Pages Mixpanel Proxy

A basic Mixpanel proxy for `<amp-analytics>` components on Google Amp Pages

```json    
 {
	"requests": {
		"event": "http://localhost:3000/event",
		"user": "http://localhost:3000/user"
	},
	"vars": {
		"userId": "",
		"anonymousId": "${clientId(uid)}",
		"token": "mixpanel-project-token"
	},
	"transport": {
		"xhrpost": true,
		"beacon": false,		
		"image": false,
		"useBody": true
	},
	"extraUrlParams": {
		"eventName": "${eventName}",
		"userId": "${userId}",
		"anonymousId": "${anonymousId}",
		"url": "${canonicalUrl}",
		"title": "${title}",
		"token": "${token}",
		"props": {
			"foo": "bar",
			"baz": "qux"
		}
	},
	"triggers": {
		"trackPageView": {
			"on": "visible",
			"request": "event",
			"vars": {
				"eventName": "page view"
			}
		},
		"trackAnchorClicks": {
			"on": "click",
			"selector": "a",
			"request": "event",
			"vars": {
				"eventName": "clicked link"
			}
		},
		"createUserProfile": {
			"on": "visible",
			"request": "user",
			"vars": {
				"foo": "DUDE"
			}
		}
	}
}
```

[![Google Cloud Btn]][Google Cloud Deploy]


[Google Cloud Btn]: https://binbashbanana.github.io/deploy-buttons/buttons/remade/googlecloud.svg
[Google Cloud Deploy]: https://deploy.cloud.run


<!-- https://github.com/GoogleCloudPlatform/cloud-run-button#customizing-deployment-parameters -->