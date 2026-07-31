import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { faker } from "@faker-js/faker";

import app from "../src/app";
import { prisma } from "../config/prisma";

test.beforeEach(async () => {
  await prisma.user.deleteMany();
});

test.after(async () => {
  await prisma.$disconnect();
});

test("Deve atualizar um usuário", async () => {
  const user = await prisma.user.create({
    data: {
      name: faker.person.firstName(),
      email: faker.internet.email(),
    },
  });

  const newName = faker.person.firstName();
  const newEmail = faker.internet.email();

  const response = await request(app).put(`/users/${user.id}`).send({
    name: newName,
    email: newEmail,
  });

  assert.deepStrictEqual(response.status, 200);

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  assert.deepStrictEqual(updatedUser?.name, newName);
  assert.deepStrictEqual(updatedUser?.email, newEmail);
});

test("Deve atualizar apenas o nome de um usuário", async () => {
  const user = await prisma.user.create({
    data: {
      name: faker.person.firstName(),
      email: faker.internet.email(),
    },
  });

  const newName = faker.person.firstName();

  const response = await request(app).put(`/users/${user.id}`).send({
    name: newName,
  });

  assert.deepStrictEqual(response.status, 200);

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  assert.deepStrictEqual(updatedUser?.name, newName);
  assert.deepStrictEqual(updatedUser?.email, user.email);
});

test("Deve retornar erro se tentar atualizar um usuário inexistente", async () => {
  const response = await request(app).put("/users/999999").send({
    name: faker.person.firstName(),
    email: faker.internet.email(),
  });

  assert.deepStrictEqual(response.status, 404);
});

test("Deve retornar erro se tentar atualizar um email já existente", async () => {
  const user1 = await prisma.user.create({
    data: {
      name: faker.person.firstName(),
      email: faker.internet.email(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: faker.person.firstName(),
      email: faker.internet.email(),
    },
  });

  const response = await request(app).put(`/users/${user2.id}`).send({
    email: user1.email,
  });

  assert.deepStrictEqual(response.status, 409);
});

test("Deve retornar erro ao atualizar um usuário com email inválido", async () => {
  const user = await prisma.user.create({
    data: {
      name: faker.person.firstName(),
      email: faker.internet.email(),
    },
  });

  const response = await request(app)
    .put(`/users/${user.id}`)
    .send({
      email: "email-invalido",
    });

  assert.deepStrictEqual(response.status, 400);
  assert.deepStrictEqual(response.body, "Invalid email");
});