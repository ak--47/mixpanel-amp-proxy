# AMP Pages Mixpanel Proxy

A basic Mixpanel proxy for `<amp-analytics>` components on Google Amp Pages

```json    
  {
	"requests": {
		"event": "http://proxy/event",
		"user": "http://proxy/user"
	},
	"vars": {
		"userId": "ABC123",
		"anonymousId": "${clientId(uid)}"
	},
	"transport": {
		"beacon": false,
		"xhrpost": true,
		"image": false,
		"useBody": true
	},
	"extraUrlParams": {
		"eventName": "${eventName}",
		"userId": "${userId}",
		"anonymousId": "${anonymousId}",
		"url": "${canonicalUrl}",
		"title": "${title}",
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
		"trackButtonClicks": {
			"on": "click",
			"selector": "button",
			"request": "event",
			"vars": {
				"eventName": "clicked button"
			}
		},
		"scrollPings": {
			"on": "scroll",
			"scrollSpec": {
				"verticalBoundaries": [
					90
				]
			},
			"request": "event",
			"vars": {
				"eventName": "scrolled 90%"
			}
		},
		"createUserProfile": {
			"on": "visible",
			"request": "user",
			"vars": {
				"hello": "world"
			}
		}
	}
}

```

[![Google Cloud Btn]][Google Cloud Deploy]


[Google Cloud Btn]: https://binbashbanana.github.io/deploy-buttons/buttons/remade/googlecloud.svg
[Google Cloud Deploy]: https://deploy.cloud.run


<!-- https://github.com/GoogleCloudPlatform/cloud-run-button#customizing-deployment-parameters -->