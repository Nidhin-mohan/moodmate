import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoodMate API',
      version: '1.0.0',
      description: 'API documentation for MoodMate mood tracking application',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'user', 'therapist'] },
          },
        },
        MoodLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            mood: { type: 'string' },
            specificEmotion: { type: 'string' },
            intensity: { type: 'integer', minimum: 1, maximum: 10 },
            energyLevel: { type: 'integer', minimum: 1, maximum: 10 },
            tagsPeople: { type: 'array', items: { type: 'string' } },
            tagsPlaces: { type: 'array', items: { type: 'string' } },
            tagsEvents: { type: 'array', items: { type: 'string' } },
            sleepHours: { type: 'number', minimum: 0, maximum: 24 },
            sleepQuality: { type: 'integer', minimum: 1, maximum: 5 },
            exercise: { type: 'boolean' },
            notes: { type: 'string', maxLength: 2000 },
            reflections: { type: 'string', maxLength: 2000 },
            date: { type: 'string', format: 'date-time' },
          },
          required: ['mood'],
        },
        CreateMoodLog: {
          type: 'object',
          properties: {
            mood: { type: 'string' },
            specificEmotion: { type: 'string' },
            intensity: { type: 'integer', minimum: 1, maximum: 10 },
            energyLevel: { type: 'integer', minimum: 1, maximum: 10 },
            tagsPeople: { type: 'array', items: { type: 'string' } },
            tagsPlaces: { type: 'array', items: { type: 'string' } },
            tagsEvents: { type: 'array', items: { type: 'string' } },
            sleepHours: { type: 'number', minimum: 0, maximum: 24 },
            sleepQuality: { type: 'integer', minimum: 1, maximum: 5 },
            exercise: { type: 'boolean' },
            notes: { type: 'string', maxLength: 2000 },
            reflections: { type: 'string', maxLength: 2000 },
            date: { type: 'string', format: 'date-time' },
          },
          required: ['mood'],
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errorCode: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'User registered successfully' },
            '400': { description: 'Validation error' },
            '409': { description: 'Email already exists' },
            '429': { description: 'Too many attempts' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful, returns JWT token' },
            '401': { description: 'Invalid credentials' },
            '429': { description: 'Too many attempts' },
          },
        },
      },
      '/auth/profile': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'User profile data' },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/mood': {
        post: {
          tags: ['Mood'],
          summary: 'Create a mood log',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMoodLog' },
              },
            },
          },
          responses: {
            '201': { description: 'Mood log created' },
            '400': { description: 'Validation error' },
            '401': { description: 'Not authenticated' },
          },
        },
        get: {
          tags: ['Mood'],
          summary: 'List mood logs (paginated)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'mood', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated list of mood logs' },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/mood/stats': {
        get: {
          tags: ['Mood'],
          summary: 'Get aggregated mood statistics',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
          responses: {
            '200': { description: 'Aggregated mood stats (averages + mood breakdown)' },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/mood/{id}': {
        get: {
          tags: ['Mood'],
          summary: 'Get a single mood log',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Mood log data' },
            '400': { description: 'Invalid ObjectId' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Mood log not found' },
          },
        },
        put: {
          tags: ['Mood'],
          summary: 'Update a mood log',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMoodLog' },
              },
            },
          },
          responses: {
            '200': { description: 'Mood log updated' },
            '400': { description: 'Validation error or invalid ObjectId' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Mood log not found' },
          },
        },
        delete: {
          tags: ['Mood'],
          summary: 'Delete a mood log',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Mood log deleted' },
            '400': { description: 'Invalid ObjectId' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Mood log not found' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
