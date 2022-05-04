import request from "supertest";
import { app } from "../src/app"
import { createOrganizationTestData, signInTestData } from "./testData";
import "./initialization";

async function signIn() {
  const signIn = await request(app)
    .post("/auth/login")
    .send(signInTestData);
  return signIn.headers.authorization;
}

describe("organization", () => {
  test("create organization", async () => {
    const authorization = await signIn();
    return request(app)
      .post("/organizations")
      .set({ authorization })
      .send(createOrganizationTestData)
      .expect(201)
  })

  test("get organizations", async () => {
    const authorization = await signIn();
    return request(app)
      .get("/organizations")
      .set({ authorization })
      .expect(200)
  })

  test("get organization", async () => {
    const authorization = await signIn();
    const organizations = await request(app)
      .get("/organizations")
      .set({ authorization })
    const id = organizations.body.data[0].id
    const response =  await request(app)
      .get(`/organizations/${id}`)
      .set({ authorization })
    expect(response.statusCode).toBe(200);
    expect(response.body.data.id).toBe(id);
  })

  test("add members", async () => {
    const authorization = await signIn();
    
  })
})