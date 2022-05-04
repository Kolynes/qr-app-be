import request from "supertest";
import { signInTestData, signUpTestData } from "./testData";
import { app } from "../src/app"

describe("auth", () => {
  test("sign up", async () => {
    return request(app)
      .post("/auth/signup")
      .send(signUpTestData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
  });

  test("login", async () => {
    return request(app)
      .post("/auth/login")
      .send(signInTestData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
  });
})
