const request = require("supertest");
const app = require("../server.js");

describe("Mixpanel AMP Proxy Server Tests", () => {
	
	test("throws on missing token", async () => {
		const response = await request(app).post("/event").send({});

		expect(response.statusCode).toBe(400);
		expect(response.text).toBe("token is required");
	});

	test("throws on missing event name", async () => {
		const response = await request(app).post("/event").send({
			token: "foo",
		});

		expect(response.statusCode).toBe(400);
		expect(response.text).toBe("eventName is required");
	});

	test("throws on missing userId for profiles", async () => {
		const response = await request(app).post("/user").send({
			token: "foo",
		});

		expect(response.statusCode).toBe(400);
		expect(response.text).toBe("userId is required for /user");
	});

	test("throws on missing userId for identify", async () => {
		const response = await request(app).post("/identify").send({
			token: "foo",
		});

		expect(response.statusCode).toBe(400);
		expect(response.text).toBe("userId is required for /identify");
	});

	test("sends events", async () => {
		const response = await request(app).post("/event").send({
			eventName: "page view",
			anonymousId: "some-anonymous-id",
			token: "foo",
		});

		expect(response.statusCode).toBe(200);
		expect(response.text).toBe("ok");
	});

	test("sends users", async () => {
		const response = await request(app).post("/user").send({
			userId: "some-user-id",
			token: "foo",
		});

		expect(response.statusCode).toBe(200);
		expect(response.text).toBe("ok");
	});

	test("sends identify", async () => {
		const response = await request(app).post("/identify").send({
			userId: "some-user-id",
			token: "foo",
			anonymousId: "some-anonymous-id"
		});

		expect(response.statusCode).toBe(200);
		expect(response.text).toBe("ok");
	});
});
