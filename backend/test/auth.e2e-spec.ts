import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthResponseDto } from '../src/auth/dto/auth-response.dto';

interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const users = new Map<string, MockUser>();

  const prismaMock = {
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) return users.get(where.email) ?? null;
          if (where.id) {
            return (
              Array.from(users.values()).find((u) => u.id === where.id) ?? null
            );
          }
          return null;
        },
      ),
      create: jest.fn(({ data }: { data: Omit<MockUser, 'id' | 'role'> }) => {
        const user: MockUser = {
          id: `user-${users.size + 1}`,
          role: 'USER',
          firstName: null,
          lastName: null,
          ...data,
        };
        users.set(user.email, user);
        return user;
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const registerPayload = {
    email: 'e2e.user@example.com',
    password: 'StrongP@ss1',
    firstName: 'E2E',
    lastName: 'User',
  };

  it('/auth/register (POST) creates a user and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerPayload)
      .expect(201);

    const body = res.body as AuthResponseDto;
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(registerPayload.email);
  });

  it('/auth/register (POST) rejects a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerPayload)
      .expect(409);
  });

  it('/auth/register (POST) rejects an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('/auth/login (POST) authenticates with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      })
      .expect(200);

    const body = res.body as AuthResponseDto;
    expect(body.accessToken).toBeDefined();
  });

  it('/auth/login (POST) rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerPayload.email, password: 'wrong-password' })
      .expect(401);
  });
});
