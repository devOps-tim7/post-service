import { loggedIn, loggedInDontThrow } from '../middleware/Auth';
import { mocked } from 'ts-jest/utils';
import { Gender, RelationType } from '../helpers/shared';
import User from '../models/User';
import { createServer } from '../../server';
import connection from '../helpers/Connection';
import supertest from 'supertest';
import path from 'path';
import UploadService from '../services/UploadService';
import AdminService from '../services/AdminService';
import AgentService from '../services/AgentService';
import Post from '../models/Post';
import Relation from '../models/Relation';

jest.mock('../middleware/Auth');

const app = createServer();

const defaultUser = {
  id: 'f8c96129-50b0-4d1f-82f6-3e7886da95d9',
  username: 'user',
  gender: Gender.Male,
  birthDate: new Date('1997-04-21'),
  banned: false,
  private: false,
};

const uploadSpy = jest.spyOn(UploadService, 'uploadToCloudinary').mockResolvedValue('pathToImage1');
const adminSpy = jest.spyOn(AdminService, 'createPost').mockResolvedValue();
const agentSpy = jest.spyOn(AgentService, 'createPostPromotions').mockResolvedValue();

describe('PostController tests', () => {
  let user;
  beforeEach(async () => {
    await connection.clear();
    user = await new User(defaultUser).save();

    mocked(loggedIn, true).mockImplementation((req, _res, next) => {
      req.user = user;
      next();
    });

    mocked(loggedInDontThrow, true).mockImplementation((req, _res, next) => {
      req.user = user;
      next();
    });
  });
  describe('create', () => {
    it('creates a post with default filters', async () => {
      const data = {
        description: 'Description',
        exposureDate: '2021-06-23T00:00:00.000Z',
        tags: [],
        hidden: false,
        user: {
          id: user.id,
          username: user.username,
        },
        image: 'pathToImage1',
        ageFilterLow: 0,
        ageFilterHigh: 150,
        genderFilter: Gender.Everyone,
      };

      const response = await supertest(app)
        .post('/api/posts')
        .field('description', 'Description')
        .field('exposureDate', '2021-06-23T00:00:00.000Z')
        .field('campaignDates', '[]')
        .field('tags', '[]')
        .attach('image', path.resolve(__dirname, '../../resources/random.jpg'));

      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(adminSpy).toHaveBeenCalledTimes(1);
      expect(agentSpy).toHaveBeenCalledWith([]);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(data);
    });
  });

  describe('get by tags', () => {
    describe('when post has tags', () => {
      beforeEach(async () => {
        const user2 = await new User({
          ...defaultUser,
          id: '77992c1f-e5d1-4cfb-84b0-1c75d96215fb',
          username: 'user2',
        }).save();

        await new Post({
          user,
          description: 'ree',
          image: '123',
          tags: [user2],
          ageFilterHigh: 0,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Everyone,
          hidden: false,
        }).save();
      });

      describe('username exists', () => {
        describe('user is public', () => {
          it('shows up on results', async () => {
            const response = await supertest(app).get('/api/posts/tagged?username=user2');
            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(1);
          });
        });
        describe('user is private and different from request initiator', () => {
          it('shows no results', async () => {
            await connection.clear();

            const newUser = await new User({
              ...defaultUser,
              private: true,
              id: 'b9ea6599-933d-4ca6-8351-10e8235640b4',
            }).save();

            const user2 = await new User({
              ...defaultUser,
              id: '77992c1f-e5d1-4cfb-84b0-1c75d96215fb',
              username: 'user2',
            }).save();

            await new Post({
              user: newUser,
              description: 'ree',
              image: '123',
              tags: [user2],
              ageFilterHigh: 0,
              ageFilterLow: 0,
              exposureDate: new Date(),
              genderFilter: Gender.Everyone,
              hidden: false,
            }).save();

            const response = await supertest(app).get('/api/posts/tagged?username=user2');
            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(0);
          });
        });

        describe('user is private and same as request initiator', () => {
          it('shows no results', async () => {
            await connection.clear();

            user = await new User({
              ...defaultUser,
              private: true,
              id: 'b9ea6599-933d-4ca6-8351-10e8235640b4',
            }).save();

            const user2 = await new User({
              ...defaultUser,
              id: '77992c1f-e5d1-4cfb-84b0-1c75d96215fb',
              username: 'user2',
            }).save();

            await new Post({
              user,
              description: 'ree',
              image: '123',
              tags: [user2],
              ageFilterHigh: 0,
              ageFilterLow: 0,
              exposureDate: new Date(),
              genderFilter: Gender.Everyone,
              hidden: false,
            }).save();

            const response = await supertest(app).get('/api/posts/tagged?username=user2');
            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(1);
          });
        });
      });

      describe('username doesnt exist', () => {
        it('shows no results', async () => {
          const response = await supertest(app).get('/api/posts/tagged?username=user5');
          expect(response.statusCode).toBe(200);
          expect(response.body.length).toBe(0);
        });
      });
    });
    describe('when there are no tags at all', () => {
      it('shows no results', async () => {
        await new Post({
          user,
          description: 'ree',
          image: '123',
          tags: [],
          ageFilterHigh: 0,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Everyone,
          hidden: false,
        }).save();

        const response = await supertest(app).get('/api/posts/tagged?username=test');
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
      });
    });
  });

  describe('get feed', () => {
    let postUser;

    beforeEach(async () => {
      postUser = await new User({
        ...defaultUser,
        id: '77992c1f-e5d1-4cfb-84b0-1c75d96215fb',
        username: 'user5',
      }).save();
    });
    describe('filters', () => {
      it('shows posts for male gender and everyone', async () => {
        await new Post({
          user: postUser,
          description: 'ree',
          image: '123',
          tags: [],
          ageFilterHigh: 150,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Male,
          hidden: false,
          campaign: true,
        }).save();

        await new Post({
          user: postUser,
          description: 'ree',
          image: '123',
          tags: [],
          ageFilterHigh: 150,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Female,
          hidden: false,
          campaign: true,
        }).save();

        await new Post({
          user: postUser,
          description: 'ree',
          image: '123',
          tags: [],
          ageFilterHigh: 150,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Everyone,
          hidden: false,
          campaign: true,
        }).save();

        const response = await supertest(app).get('/api/posts');
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].genderFilter).toEqual(Gender.Everyone);
        expect(response.body[1].genderFilter).toEqual(Gender.Male);
      });
    });

    describe('following', () => {
      beforeEach(async () => {
        await new Post({
          user: postUser,
          description: 'ree',
          image: '123',
          tags: [],
          ageFilterHigh: 150,
          ageFilterLow: 0,
          exposureDate: new Date(),
          genderFilter: Gender.Everyone,
          hidden: false,
        }).save();
      });
      describe('when request initiator follows the poster', () => {
        it('shows up on the feed', async () => {
          await new Relation({
            subject: user,
            object: postUser,
            type: RelationType.Follow,
            pending: false,
          }).save();

          const response = await supertest(app).get('/api/posts');
          expect(response.statusCode).toBe(200);
          expect(response.body.length).toBe(1);
        });
      });
      describe('when request initiator doesnt follow the poster', () => {
        it('doesnt show up on the feed', async () => {
          const response = await supertest(app).get('/api/posts');
          expect(response.statusCode).toBe(200);
          expect(response.body.length).toBe(0);
        });
      });
    });
  });
});
