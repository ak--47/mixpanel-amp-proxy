# AMP Pages Mixpanel Proxy

A basic Mixpanel proxy for use with `<amp-analytics>` components on Google Amp Pages.

## Setup the Proxy

The proxy server sits between your AMP pages and Mixpanel. You can run it on your own infrastructure or use a serverless provider; choose a deployment strategy below and once you have a URL for the proxy, you can [configure your front-end](#frontend).

### One Click Deploys!

[![Google Cloud Btn]][Google Cloud Deploy]
[<img src=https://www.deploytodo.com/do-btn-blue.svg width=198px />][Digital Ocean Deploy]
[![Railway Btn]][Railway Deploy]
[![Render Btn]][Render Deploy]

[Google Cloud Btn]: https://binbashbanana.github.io/deploy-buttons/buttons/remade/googlecloud.svg
[Google Cloud Deploy]: https://deploy.cloud.run?git_repo=https://github.com/ak--47/mixpanel-amp-proxy

[Digital Ocean Btn]: https://www.deploytodo.com/do-btn-blue.svg
[Digital Ocean Deploy]: https://cloud.digitalocean.com/apps/new?repo=https://github.com/ak--47/mixpanel-amp-proxy

[Railway Btn]: https://binbashbanana.github.io/deploy-buttons/buttons/remade/railway.svg
[Railway Deploy]: https://railway.app/template/1ZbUOb?referralCode=t6z7XI

[Render Btn]: https://binbashbanana.github.io/deploy-buttons/buttons/remade/render.svg
[Render Deploy]: https://render.com/deploy?repo=https://github.com/ak--47/mixpanel-amp-proxy



### Manual Deploys
- GCP

```bash
# clone repo
git clone https://github.com/ak--47/mixpanel-amp-proxy.git
cd mixpanel-amp-proxy

# set project id and enable cloud run and cloud build
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/mixpanel-amp-proxy
gcloud run deploy mixpanel-amp-proxy --image gcr.io/YOUR_GCP_PROJECT_ID/mixpanel-amp-proxy --platform managed --allow-unauthenticated
```

then copy the url of the deployed service; you will use this as the value of `requests` key in your `<amp-analytics>` component (replace with `{{YOUR-PROXY}}`)

- on AWS:

```bash
aws configure
git clone https://github.com/ak--47/mixpanel-amp-proxy.git
cd mixpanel-amp-proxy


# Create a Repository in Amazon ECR + Login
aws ecr create-repository --repository-name mixpanel-amp-proxy
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com

# build and push image to ECR
docker build -t mixpanel-amp-proxy .
docker tag mixpanel-amp-proxy:latest your-account-id.dkr.ecr.your-region.amazonaws.com/mixpanel-amp-proxy:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/mixpanel-amp-proxy:latest

# create a lambda function to run the container
aws lambda create-function --function-name mixpanel-amp-proxy \
--package-type Image \
--code ImageUri=your-account-id.dkr.ecr.your-region.amazonaws.com/mixpanel-amp-proxy:latest \
--role arn:aws:iam::your-account-id:role/your-lambda-role
```

<div id="frontend"></div>

## Configure Front End

- within `<head>` tag, include [required scripts](https://amp.dev/documentation/components/amp-analytics)

```html
<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
```

- within `<body>` tag, include `<amp-analytics>` component [for sending in-house](https://amp.dev/documentation/components/amp-analytics#send-data-in-house); this is this is the "minimum" configuration required to replicate the SDK:

```html
<amp-analytics>
  <script type="application/json">
    {
      "requests": {
        "event": "https://{{YOUR-PROXY}}/event",
        "user": "http://{{YOUR-PROXY}}/user"
      },
      "vars": {
        "userId": "", // optional, for logged in users
        "anonymousId": "${clientId(uid)}", // AMP page's device_id
        "token": "YOUR_MIXPANEL_TOKEN" // required!
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
        "token": "${token}",
        "defaultProps": {
          "$screen_height": "${viewportHeight}",
          "$screen_width": "${viewportWidth}",
          "$referrer": "${documentReferrer}",
          "pageLoadTime": "${pageLoadTime}",
          "pageDownloadTime": "${pageDownloadTime}",
          "firstContentfulPaint": "${firstContentfulPaint}"
        },
        "superProps": {
          "hello": "world" // optional, for static properties
        }
      },
      "triggers": {
        "trackPageView": {
          "on": "visible",
          "request": "event",
          "vars": {
            "eventName": "page view"
          },
          "extraUrlParams": {
            "$current_url": "${sourceUrl}",
            "current_page_title": "${title}",
            "current_domain": "${canonicalHost}",
            "current_url_path": "${sourcePath}"
          }
        }
      }
    }
  </script>
</amp-analytics>
```

you can create other types of events by adding them to the `triggers` object; `triggers` have many different [listeners](https://amp.dev/documentation/components/amp-analytics#available-triggers). you can use standard [AMP variables](https://amp.dev/documentation/components/amp-analytics#amp-variables) or [custom variables](https://amp.dev/documentation/components/amp-analytics#custom-variables) to send data to the proxy.

given:

```html
<!-- LINK -->
<a href="#" data-vars-link-url="aktunes.com">yoo</a>
<!-- BUTTON -->
<button href="#" data-vars-button-name="foo">Don't click</button>
```

we could setup tracking as:

```json
{
  "trackAnchorClicks": {
    "on": "click",
    "selector": "a",
    "request": "event",
    "vars": {
      "eventName": "clicked link"
    },
    "extraUrlParams": {
      "link_url": "${linkUrl}"
    }
  },
  "trackButtonClicks": {
    "on": "click",
    "selector": "button",
    "request": "event",
    "vars": {
      "eventName": "clicked button"
    },
    "extraUrlParams": {
      "button_name": "${buttonName}"
    }
  }
}
```

any `data-vars-*` attributes will be available as variables; anything you put in `extraUrlParams` will become event properties.

you can also send user properties too; you want to make sure you set a `userId` top level OR in `extraUrlParams`:


```json
{
  "createUserProfile": {
    "on": "visible",
    "request": "user",
    "extraUrlParams": {
      "$name": "AK",
      "$email": "ak@mixpanel.com",
	  "userId": "1234"
    }
  }
}
```

for a longer example see [`config.json` in the `/examples` folder](https://github.com/ak--47/mixpanel-amp-proxy/blob/main/examples/config.json)



